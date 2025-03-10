const { contains } = require('validator');
const prisma = require('../../db/prisma/client');
const { use } = require('./shops.controller');

// 상점shop 생성
async function createShop(req, res, next) {
  try {
    const userId = req.userId;
    const cardId = req.body.cardId;

    // 재고 수량 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        cardEditions: {
          where: { cardId, status: 'inPossesion' },
          orderBy: { number: 'asc' },
        },
      },
    });

    const quantity = user.cardEditions.length;
    const isSufficientQuantity = quantity >= req.body.salesCount;
    if (!isSufficientQuantity) throw new Error('400/Not sufficient quantity');

    // shop을 생성하고,
    // salesCount개수에 해당하는 만큼의 에디션들의 shopId와 상태(onSales)를 변경
    const shop = await prisma.$transaction(async (tx) => {
      // #1. shop 생성
      const data = { ...req.body, userId };
      const shop = await tx.shop.create({
        data,
        include: { cardEditions: true },
      });

      // #2. 에디션 업데이트
      // 업데이트해야할 에디션들의 number를 확인
      const tempCardEditions = user.cardEditions.slice(0, req.body.salesCount);
      const editionNumbers = tempCardEditions.map((el) => el.number);
      const editionData = { shopId: shop.id, status: 'onSales' };

      const willUpdateEditionsPromises = editionNumbers.map(
        async (editionNumber) => {
          return tx.cardEdition.updateMany({
            data: editionData,
            where: { cardId, userId, number: editionNumber },
          });
        }
      );

      await Promise.all(willUpdateEditionsPromises);

      return shop;
    });

    res.status(201).json(shop);
  } catch (error) {
    next(error);
  }
}

// 상점 shop 수정
async function updateShop(req, res, next) {
  try {
    // 요청에서 샵 ID 가져오기, 이건 req에서
    const shopId = req.params.shopId;
    const userId = req.userId;
    const {
      countToEdit,
      price,
      exchangeGrade,
      exchangeGenre,
      exchangeDesc,
      remainingCount,
    } = req.body;

    const shop = await prisma.shop.findFirst({
      where: { id: shopId, userId: userId },
      select: { cardId: true },
    });

    const cardId = shop.cardId;

    // 재고 수량 확인, 가지고 있는 카드 + 판매중인 카드(현재 샵에서만, 다른 샵 x)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        cardEditions: {
          where: {
            OR: [
              { cardId, status: 'inPossesion' },
              { shopId, status: 'onSales' },
            ],
          },
          orderBy: { number: 'asc' },
        },
      },
    });

    const availableQuantity = user.cardEditions.length;
    const isSufficientQuantity = availableQuantity >= countToEdit;
    if (!isSufficientQuantity) throw new Error('400/Not sufficient quantity');

    // { shopId: shop.id, status: 'onSales' }
    // if (수정할 개수 < 판매중인 개수) shopID에 연동된 카드들의 값을 변경
    // else 사용자가 가지고 있는 CardId의 카드중 status가 inPossesion 인걸 변경

    if (countToEdit === remainingCount) {
      // CASE_1 : 수정할 개수 === 판매중인 개수
      // 카드 개수를 제외한 나머지 데이터만 변경
      const updatedShop = await prisma.shop.update({
        where: { id: shopId },
        data: {
          price,
          exchangeGrade,
          exchangeGenre,
          exchangeDesc,
        },
      });

      res.status(201).json(updatedShop);
    } else if (countToEdit < remainingCount) {
      // CASE_2 : 수정할 개수 < 판매중인 개수
      const shop = await prisma.$transaction(async (tx) => {
        // 샵 데이터를 cardEditions 포함해서 가지고옴
        const shop = await tx.shop.findUnique({
          where: { id: shopId },
          include: {
            cardEditions: {
              orderBy: { number: 'asc' },
            },
          },
        });

        // 샵에 등록된 카드에디션들을 배열의 끝에서 부터 요청한 개수만큼 상태 변경 ('onSales' -> 'inPossesion')
        const numberToMinus = remainingCount - countToEdit;
        const tempCardEditions = shop.cardEditions.slice(-numberToMinus);
        const editionNumbers = tempCardEditions.map((el) => el.number);
        const editionData = { shopId: null, status: 'inPossesion' };

        const willUpdateEditionsPromises = editionNumbers.map(
          async (editionNumber) => {
            return tx.cardEdition.updateMany({
              data: editionData,
              where: { cardId, userId, number: editionNumber },
            });
          }
        );

        await Promise.all(willUpdateEditionsPromises);

        // 그외 나머지 shop 데이터 변경
        const updatedShop = await tx.shop.update({
          where: { id: shopId },
          data: {
            price,
            exchangeGrade,
            exchangeGenre,
            exchangeDesc,
            salesCount: countToEdit,
          },
        });

        return updatedShop;
      });

      res.status(201).json(shop);
    } else {
      // CASE_3 : 소유중 + 판매중(현재샵) >= 수정할 개수 > 판매중인 개수
      const shop = await prisma.$transaction(async (tx) => {
        // 유저가 특정 CardId중 'inPossession'하고 있는 데이터 조회
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            cardEditions: {
              where: { cardId, status: 'inPossesion' },
              orderBy: { number: 'asc' },
            },
          },
        });

        //유저가 들고있는 카드에디션들을 요청한 개수만큼 상태를 inPossession -> onSales 로 변경
        const numberToAdd = countToEdit - remainingCount;
        const tempCardEditions = user.cardEditions.slice(0, numberToAdd);
        const editionNumbers = tempCardEditions.map((el) => el.number);
        const editionData = { shopId, status: 'onSales' };

        const willUpdateEditionsPromises = editionNumbers.map(
          async (editionNumber) => {
            return tx.cardEdition.updateMany({
              data: editionData,
              where: { cardId, userId, number: editionNumber },
            });
          }
        );

        await Promise.all(willUpdateEditionsPromises);

        // 그외 나머지 shop 데이터 변경
        const updatedShop = await tx.shop.update({
          where: { id: shopId },
          data: {
            price,
            exchangeGrade,
            exchangeGenre,
            exchangeDesc,
            salesCount: countToEdit,
          },
        });

        return updatedShop;
      });

      res.status(201).json(shop);
    }
  } catch (error) {
    next(error);
  }
}

// shop 목록 조회
async function getShops(req, res, next) {
  try {
    const {
      orderBy: queryOrderBy,
      grade: queryGrade,
      genre: queryGenre,
      onSale,
      keyword,
      limit,
      skip,
    } = req.query;

    console.log(limit, skip);

    const genre = queryGenre !== '장르' ? queryGenre : undefined;
    const grade = queryGrade !== '등급' ? queryGrade : undefined;
    const orderBy =
      queryOrderBy === '최신 순'
        ? { createdAt: 'desc' }
        : queryOrderBy === '오래된 순'
        ? { createdAt: 'asc' }
        : queryOrderBy === '높은 가격순'
        ? { price: 'desc' }
        : { price: 'asc' };
    const shops = await prisma.shop.findMany({
      where: {
        OR: [
          {
            card: {
              grade,
              genre,
              OR: [{ name: { contains: keyword, mode: 'insensitive' } }],
            },
          },
          {
            AND: {
              card: {
                grade,
                genre,
              },
              user: { nickname: { contains: keyword } },
            },
          },
        ],
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      select: {
        id: true,
        price: true,
        salesCount: true,
        _count: { select: { cardEditions: true } },
        // user: { select: { nickname: true } },
        card: {
          select: {
            name: true,
            grade: true,
            genre: true,
            imgUrl: true,
            user: { select: { nickname: true } },
          },
        },
      },
      orderBy,
    });

    let filteredShops;
    if (onSale === '판매 중') {
      filteredShops = shops.filter((shop) => shop._count.cardEditions !== 0);
    } else if (onSale === '판매 완료') {
      filteredShops = shops.filter((shop) => shop._count.cardEditions === 0);
    } else {
      filteredShops = shops;
    }

    const resData = filteredShops.map((shop) => {
      const newShop = {
        id: shop.id,
        name: shop.card.name,
        imgUrl: shop.card.imgUrl,
        grade: shop.card.grade,
        genre: shop.card.genre,
        nickname: shop.card.user.nickname,
        price: shop.price,
        remainingCount: shop._count.cardEditions,
        salesCount: shop.salesCount,
      };

      return newShop;
    });

    res.status(200).json(resData);
  } catch (error) {
    next(error);
  }
}

// shop 상세 조회
async function getShop(req, res, next) {
  try {
    const shopId = req.params.shopId;

    // shop Id를 먼저 조회하는게 나은가?
    const shopForCardId = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        card: true,
      },
    });
    const cardId = shopForCardId.card.id;

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            nickname: true,
            cardEditions: {
              where: {
                OR: [
                  { cardId, status: 'inPossesion' },
                  { shopId, status: 'onSales' },
                ],
              },
            },
          },
        },
        price: true,
        salesCount: true,
        exchangeGrade: true,
        exchangeGenre: true,
        exchangeDesc: true,
        _count: { select: { cardEditions: true } },
        card: {
          select: {
            id: true,
            name: true,
            grade: true,
            genre: true,
            imgUrl: true,
            description: true,
            user: { select: { nickname: true } },
          },
        },
      },
    });

    const newShop = {
      id: shop.id,
      sellerId: shop.user.id,
      seller: shop.user.nickname,
      name: shop.card.name,
      imgUrl: shop.card.imgUrl,
      grade: shop.card.grade,
      genre: shop.card.genre,
      nickname: shop.card.user.nickname,
      description: shop.card.description,
      price: shop.price,
      remainingCount: shop._count.cardEditions,
      salesCount: shop.salesCount,
      exchangeGrade: shop.exchangeGrade,
      exchangeGenre: shop.exchangeGenre,
      exchangeDesc: shop.exchangeDesc,
      availableQuantity: shop.user.cardEditions.length,
    };

    res.status(200).json(newShop);
  } catch (error) {
    next(error);
  }
}

// 상점 삭제하기(판매 내리기)
async function deleteShop(req, res, next) {
  try {
    const shopId = req.params.shopId;

    // #1. 상점에 있는 cardEditions 정보 업데이트
    await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.findUnique({
        where: { id: shopId },
        select: { cardEditions: true },
      });

      const editionIds = shop.cardEditions.map((edition) => edition.id);
      console.log(editionIds);
      // - 상점 ID 삭제
      // - status를 inPossesion으로 변경
      const editionData = {
        shopId: null,
        status: 'inPossesion',
      };
      const willUpdateEditionsPromises = editionIds.map(async (editionId) =>
        tx.cardEdition.updateMany({
          data: editionData,
          where: { id: editionId },
        })
      );
      await Promise.all(willUpdateEditionsPromises);

      // TODO: #2. 교환 제시받은 목록이 있을 경우 해당 로직도 반영해야 함

      // #3. 상점 삭제
      await tx.shop.delete({ where: { id: shopId } });
    });

    res.status(204).send('Delete complete');
  } catch (error) {
    next(error);
  }
}

// 상점에서 카드 구매하기
async function purchaseCards(req, res, next) {
  try {
    const { purchaseCount, price } = req.body;
    const userId = req.userId;
    const shopId = req.params.shopId;

    // #1. 상점의 잔여 수량이 구매 수량 이상인지 확인하기
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        user: true,
        cardEditions: { orderBy: { number: 'asc' } },
        _count: { select: { cardEditions: true } },
      },
    });
    const remainingCount = shop._count.cardEditions;
    if (purchaseCount > remainingCount)
      throw new Error('400/Not sufficient quantity');

    // #2. 구매자의 보유 포인트가 총 가격 이상인지 확인하기
    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: { point: true, nickname: true }, // TODO: 닉네임은 로그 찍은 후에는 필요없으면 삭제
    });
    const totalAmount = purchaseCount * price;
    const buyerPoint = buyer.point;

    if (totalAmount > buyerPoint) throw new Error('400/Not sufficient point');

    // #3. $transaction으로 구매 로직 수행
    const purchase = await prisma.$transaction(async (tx) => {
      // 3-1. 사용자 정보 업데이트하기
      // - 구매자: totalAmount만큼 포인트 차감
      await tx.user.update({
        where: { id: userId },
        data: { point: buyerPoint - totalAmount },
      });
      // - 판매자: totalAmount만큼 포인트 증가
      await tx.user.update({
        where: { id: shop.user.id },
        data: { point: shop.user.point + totalAmount },
      });

      // 3-2. purchase (테이블) 생성
      // - 데이터: buyerId, sellerId, cardId, cardEditions, price, purchaseCount
      const purchase = await tx.purchase.create({
        data: { buyerId: userId, sellerId: shop.user.id, price, purchaseCount },
      });

      // 3-3. 판매한 에디션들의 정보 업데이트하기
      // 상점 에디션들 중 구매 수량만큼 에디션을 뽑아서 id 배열로 만들기
      const purchaseCardEditions = shop.cardEditions.slice(0, purchaseCount);
      const editionIds = purchaseCardEditions.map((edition) => edition.id);
      // - 상점 ID 삭제
      // - 소유자 ID를 구매자 변경
      // - 상태를 inPossesion으로 변경
      // - purchaseId에 생성한 purchase의 id를 연결
      const editionData = {
        shopId: null,
        userId,
        status: 'inPossesion',
        purchaseId: purchase.id,
      };
      const willUpdateEditionsPromises = editionIds.map(async (editionId) =>
        tx.cardEdition.updateMany({
          data: editionData,
          where: { id: editionId },
        })
      );
      await Promise.all(willUpdateEditionsPromises);

      return purchase;
    });

    // 매진인지 확인하기
    const isSoldOut = purchaseCount === remainingCount;
    const newPurchase = { ...purchase, isSoldOut };

    res.status(201).json(newPurchase);
  } catch (error) {
    next(error);
  }
}

// 카드 교환 제안하기
async function proposeExchange(req, res, next) {
  try {
    const userId = req.userId;
    const shopId = req.params.shopId;
    const content = req.body.content;
    const cardId = req.body.cardId;

    console.log(shopId, cardId, content);

    await prisma.$transaction(async (tx) => {
      // #1. Exchange 생성하기
      const exchange = await tx.exchange.create({
        data: {
          content,
          shopId,
          proposerId: userId,
          status: 'pending',
        },
      });

      // #2. 교환 제안자 카드 에디션의 상태를 waitingExchange로 변경, exchangeId 부여
      const editions = await tx.cardEdition.findMany({
        where: { userId, cardId },
      });
      console.log(editions);
      const editionId = editions[0].id;
      await tx.cardEdition.update({
        where: { id: editionId },
        data: { status: 'waitingExchange', exchangeId: exchange.id },
      });

      res.status(201).json(exchange);
    });
  } catch (error) {
    next(error);
  }
}

// 교환 제안 취소하기(또는 받은 제안 거절하기)
async function cancelProposeExchange(req, res, next) {
  const { editionId } = req.body;
  try {
    await prisma.$transaction(async (tx) => {
      // #1. 해당 카드 에디션의 상태를 inPossesion으로 변경
      await tx.cardEdition.update({
        where: { id: editionId },
        data: { status: 'inPossesion' },
      });
      // #2. exchange 삭제
      const { exchangeId } = req.params;
      await tx.exchange.delete({ where: { id: exchangeId } });
    });

    res.status(204).send('Delete success');
  } catch (error) {
    next(error);
  }
}

// 상점의 교환 제시 목록 조회
async function getExchangesOfShop(req, res, next) {
  try {
    const shopId = req.params.shopId;

    const exchanges = await prisma.exchange.findMany({
      where: { shopId, status: 'pending' },
      select: {
        id: true,
        cardEdition: {
          select: {
            id: true,
            card: {
              select: {
                imgUrl: true,
                name: true,
                price: true,
                grade: true,
                genre: true,
                user: { select: { nickname: true } },
              },
            },
          },
        },
        content: true,
        proposerId: true,
      },
    });

    const newExchanges = exchanges.map((exchange) => {
      const newExchange = {
        id: exchange.id,
        editionId: exchange.cardEdition.id,
        shopId,
        imgUrl: exchange.cardEdition.card.imgUrl,
        name: exchange.cardEdition.card.name,
        price: exchange.cardEdition.card.price,
        grade: exchange.cardEdition.card.grade,
        genre: exchange.cardEdition.card.genre,
        nickname: exchange.cardEdition.card.user.nickname,
        content: exchange.content,
        paidPrice: 0,
        proposerId: exchange.proposerId,
      };

      return newExchange;
    });

    res.status(200).json(newExchanges);
  } catch (error) {
    next(error);
  }
}

// 상점의 '내가 제시한 교환 목록' 조회
async function getMyExchangesOfShop(req, res, next) {
  try {
    const userId = req.userId;
    const shopId = req.params.shopId;
    console.log(userId, shopId);

    const exchanges = await prisma.exchange.findMany({
      where: { shopId, proposerId: userId, status: 'pending' },
      select: {
        id: true,
        cardEdition: {
          select: {
            id: true,
            card: {
              select: {
                imgUrl: true,
                name: true,
                price: true,
                grade: true,
                genre: true,
                user: { select: { nickname: true } },
              },
            },
          },
        },
        content: true,
        proposerId: true,
      },
    });

    const newExchanges = exchanges.map((exchange) => {
      const newExchange = {
        id: exchange.id,
        editionId: exchange.cardEdition.id,
        shopId,
        imgUrl: exchange.cardEdition.card.imgUrl,
        price: exchange.cardEdition.card.price,
        name: exchange.cardEdition.card.name,
        grade: exchange.cardEdition.card.grade,
        genre: exchange.cardEdition.card.genre,
        nickname: exchange.cardEdition.card.user.nickname,
        content: exchange.content,
        paidPrice: 0,
        proposerId: exchange.proposerId,
      };

      return newExchange;
    });

    res.status(200).json(newExchanges);
  } catch (error) {
    next(error);
  }
}

// 교환 제안 거절하기 : 거절은 취소와 동일하게 처리

// 상점의 교환 제안 승인하기
async function approveExchange(req, res, next) {
  try {
    const exchangeId = req.params.exchangeId;
    const userId = req.userId;
    const { shopId, proposerId, editionId: proposeEditionId } = req.body;

    console.log(exchangeId, shopId, proposeEditionId, userId);
    await prisma.$transaction(async (tx) => {
      // #1. exchange status를 approved로 변경
      await tx.exchange.update({
        where: { id: exchangeId },
        data: { status: 'approved' },
      });

      // #2. 교환 대상인 cardEdition들의 소유자를 변경하고 제안했던 cardEdition의 status를 inPossesion으로 변경
      // 제안자의 cardEdition 변경
      // 소유자 변경, status를 inPossesion으로
      await tx.cardEdition.update({
        where: { id: proposeEditionId },
        data: {
          userId,
          status: 'inPossesion',
        },
      });
      // shop에 있는 cardEdition 변경
      // 소유자 변경, shop연결끊기, status를 inPossesion으로
      const shop = await tx.shop.findUnique({
        where: { id: shopId },
        select: { cardEditions: { select: { id: true } } },
      });
      const willUpdateCardEditionId = shop.cardEditions[0].id;

      await tx.cardEdition.update({
        where: { id: willUpdateCardEditionId },
        data: { userId: proposerId, shopId: null, status: 'inPossesion' },
      });
    });

    res.status(200).send('Exchange success');
  } catch (error) {
    next(error);
  }
}

const shopsService = {
  createShop,
  getShops,
  getShop,
  deleteShop,
  purchaseCards,
  proposeExchange,
  getExchangesOfShop,
  getMyExchangesOfShop,
  cancelProposeExchange,
  approveExchange,
  updateShop,
};

module.exports = shopsService;
