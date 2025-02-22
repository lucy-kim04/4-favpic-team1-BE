const prisma = require('../../db/prisma/client');

async function createExchange(req, res, next) {
  try {
  } catch (error) {
    next(error);
  }
}

// shop 생성
async function createShop(req, res, next) {
  try {
    const userId = req.userId;
    const cardId = req.body.cardId;

    // 재고 수량 확인
    const result = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        cardEditions: {
          where: { cardId, status: 'inPossesion' },
          orderBy: { number: 'asc' },
        },
      },
    });

    const quantity = result.cardEditions.length;
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
      const tempCardEditions = result.cardEditions.slice(
        0,
        req.body.salesCount
      );
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

// shop 목록 조회
async function getShops(req, res, next) {
  try {
    const {
      orderBy: queryOrderBy,
      grade: queryGrade,
      genre: queryGenre,
      onSale: queryOnSale,
      keyword,
    } = req.query;

    console.log(keyword);

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
        card: {
          grade,
          genre,
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            // { description: { contains: keyword, mode: 'insensitive' } },
          ],
        },
      },
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

    const resData = shops.map((shop) => {
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

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        price: true,
        salesCount: true,
        exchangeGrade: true,
        exchangeGenre: true,
        exchangeDesc: true,
        _count: { select: { cardEditions: true } },
        // user: { select: { nickname: true } },
        card: {
          select: {
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
    };

    res.status(200).json(newShop);
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
        include: { user: { select: { id: true, point: true } } },
        salesCount: true,
        cardEditions: { orderBy: { number: 'asc' } },
      },
    });
    const salesCount = shop.salesCount;
    if (purchaseCount > salesCount)
      throw new Error('400/Not sufficient quantity');

    // #2. 구매자의 보유 포인트가 총 가격 이상인지 확인하기
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { point: true },
    });
    const totalAmount = purchaseCount * price;
    const buyerPoint = user.point;

    if (totalAmount > buyerPoint) throw new Error('400/Not sufficient point');

    // #3. $transaction으로 구매 로직 수행
    const purchase = await prisma.$transaction(async (tx) => {
      // 3-1. 상점 정보 업데이트하기
      // - salesCount에서 purchaseCount 차감
      await tx.shop.update({
        where: { id: shopId },
        data: { salesCount: salesCount - purchaseCount },
      });
      // 3-2. 사용자 정보 업데이트하기
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

      // 3-3. purchase (테이블) 생성
      // - 데이터: buyerId, sellerId, cardId, cardEditions, price, purchaseCount
      const purchase = await tx.purchase.create({
        data: { buyerId: userId, sellerId: shop.user.id, price, purchaseCount },
      });

      // 3-4. 판매한 에디션들의 정보 업데이트하기
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

    res.status(201).json(purchase);
  } catch (error) {
    next(error);
  }
}

const shopsService = {
  createExchange,
  createShop,
  getShops,
  getShop,
  purchaseCards,
};

module.exports = shopsService;
