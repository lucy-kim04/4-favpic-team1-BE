const { contains } = require('validator');
const prisma = require('../../db/prisma/client');
const { create } = require('domain');

// 카드 발행
async function createCard(req, res, next) {
  try {
    const userId = req.userId;
    const intPrice = Number(req.body.price);
    const intIssuedQuantity = Number(req.body.issuedQuantity);
    const newImgUrl = !!req.file
      ? 'http://localhost:5050/static/' + req.file.filename
      : undefined;
    req.body.price = intPrice;
    req.body.issuedQuantity = intIssuedQuantity;
    req.body.imgUrl = newImgUrl;

    const data = { ...req.body, userId };

    // interactive $transaction 적용
    const card = await prisma.$transaction(async (tx) => {
      // 카드 생성
      const card = await tx.card.create({ data });

      // 카드 에디션 생성
      for (let i = 0; i < card.issuedQuantity; i++) {
        const editionData = {
          userId,
          cardId: card.id,
          number: i + 1,
        };
        await tx.cardEdition.create({ data: editionData });
      }
      return card;
    });

    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
}

// 마이갤러리 카드 목록 조회
// 사용자가 보유한 카드 에디션들 중 status가 inPossesion인 것
async function getMyCardsOfGallery(req, res, next) {
  try {
    const userId = req.userId;

    const {
      orderBy: queryOrderBy,
      grade: queryGrade,
      genre: queryGenre,
      keyword,
    } = req.query;

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

    // $transaction 사용
    const cards = await prisma.$transaction(async (tx) => {
      const cardIds = await tx.cardEdition.groupBy({
        where: { userId },
        by: ['cardId'],
      });
      const cardIdsArray = cardIds.map((cardId) => cardId.cardId);
      const cards = await tx.card.findMany({
        where: {
          id: { in: cardIdsArray },
          cardEditions: { some: { status: 'inPossesion' } },
          grade,
          genre,
          OR: [
            { grade, genre, name: { contains: keyword, mode: 'insensitive' } },
            { grade, genre, user: { nickname: { contains: keyword } } },
          ],
        },
        orderBy,
        select: {
          id: true,
          user: { select: { nickname: true } },
          name: true,
          genre: true,
          grade: true,
          description: true,
          cardEditions: {
            where: { userId, status: 'inPossesion' },
            select: { card: { select: { grade: true } } },
          },
          price: true,
          imgUrl: true,
          _count: {
            select: {
              cardEditions: { where: { userId, status: 'inPossesion' } },
            },
          },
        },
      });

      return cards;
    });

    const totalEditions = [];
    const resData = cards.map((card) => {
      totalEditions.push(...card.cardEditions);

      const newCard = {
        id: card.id,
        imgUrl: card.imgUrl,
        name: card.name,
        grade: card.grade,
        genre: card.genre,
        nickname: card.user.nickname,
        price: card.price,
        cardEditions: card.cardEditions,
        reserveCount: card._count.cardEditions,
      };

      return newCard;
    });
    const userSummary = { COMMON: 0, RARE: 0, 'SUPER RARE': 0, LEGENDARY: 0 };
    totalEditions.forEach((edition) => (userSummary[edition.card.grade] += 1));

    const result = { cards: resData, userSummary };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// 나의 판매 포토카드 목록 조회
// 사용자가 보유한 카드 에디션들 중 status가 inPossesion이 아닌 것(onSales 또는 waitingExchange)
// 나의 shops와 exchanges를 구해서 섞어줌
async function getMyCardsOfSales(req, res, next) {
  try {
    const userId = req.userId;

    const {
      grade: queryGrade,
      genre: queryGenre,
      onSale,
      howToSale,
      keyword,
    } = req.query;

    const genre = queryGenre !== '장르' ? queryGenre : undefined;
    const grade = queryGrade !== '등급' ? queryGrade : undefined;

    const shops = await prisma.shop.findMany({
      where: {
        AND: [
          { userId },
          { card: { genre, grade, name: { contains: keyword } } },
        ],
      },
      select: {
        id: true,
        price: true,
        cardEditions: {
          select: { card: { select: { grade: true, id: true, name: true } } },
        },
        salesCount: true,
        _count: { select: { cardEditions: true } },
        card: {
          select: {
            name: true,
            grade: true,
            genre: true,
            imgUrl: true,
            user: { select: { nickname: true } },
          },
        },
        createdAt: true,
        exchanges: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalEditions = [];
    const newShops = shops.map((shop) => {
      totalEditions.push(...shop.cardEditions);

      const newShop = {
        id: shop.id,
        imgUrl: shop.card.imgUrl,
        name: shop.card.name,
        grade: shop.card.grade,
        genre: shop.card.genre,
        nickname: shop.card.user.nickname,
        price: shop.price,
        cardEditions: shop.cardEditions,
        remainingCount: shop._count.cardEditions,
        salesCount: shop.salesCount,
        isWaitingExchange: false,
        createdAt: shop.createdAt,
        exchangesCount: shop.exchanges.length,
      };

      return newShop;
    });

    console.log(newShops);

    const exchanges = await prisma.exchange.findMany({
      where: {
        AND: [
          { proposerId: userId, status: 'pending' },
          {
            cardEdition: {
              card: { genre, grade, name: { contains: keyword } },
            },
          },
        ],
      },
      select: {
        createdAt: true,
        id: true,
        cardEdition: true,
        cardEdition: {
          select: {
            card: {
              select: {
                imgUrl: true,
                name: true,
                genre: true,
                grade: true,
                price: true,
                user: { select: { nickname: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const newExchanges = exchanges.map((exchange) => {
      totalEditions.push(exchange.cardEdition);

      const newExchange = {
        id: exchange.id,
        imgUrl: exchange.cardEdition.card.imgUrl,
        name: exchange.cardEdition.card.name,
        grade: exchange.cardEdition.card.grade,
        genre: exchange.cardEdition.card.genre,
        nickname: exchange.cardEdition.card.user.nickname,
        price: exchange.cardEdition.card.price,
        remainingCount: 1,
        isWaitingExchange: true,
        createdAt: exchange.createdAt,
      };

      return newExchange;
    });

    let totalCards;
    if (howToSale === '판매중') {
      totalCards = [...newShops];
    } else if (howToSale === '교환 제시 대기 중') {
      totalCards = [...newExchanges];
    } else {
      totalCards = [...newShops, ...newExchanges];
    }

    let filteredCards;
    if (onSale === '판매 중') {
      filteredCards = totalCards.filter((card) => card.remainingCount !== 0);
    } else if (onSale === '판매 완료') {
      filteredCards = totalCards.filter((card) => card.remainingCount === 0);
    } else {
      filteredCards = totalCards;
    }

    // 전체를 최신순으로 정렬해서 섞어줌
    filteredCards.sort((a, b) => b.createdAt - a.createdAt);

    const userSummary = { COMMON: 0, RARE: 0, 'SUPER RARE': 0, LEGENDARY: 0 };
    totalEditions.forEach((edition) => (userSummary[edition.card.grade] += 1));

    const result = { cards: filteredCards, userSummary };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// 내 상점 목록 조회
async function getMyShops(req, res, next) {
  try {
    const userId = req.userId;
    const shops = await prisma.shop.findMany({
      where: { userId },
      select: {
        id: true,
        price: true,
        cardEditions: {
          select: { card: { select: { grade: true, id: true, name: true } } },
        },
        salesCount: true,
        _count: { select: { cardEditions: true } },
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
    });

    const totalEditions = [];
    const newShops = shops.map((shop) => {
      totalEditions.push(...shop.cardEditions);

      const newShop = {
        id: shop.id,
        imgUrl: shop.card.imgUrl,
        name: shop.card.name,
        grade: shop.card.grade,
        genre: shop.card.genre,
        nickname: shop.card.user.nickname,
        price: shop.price,
        cardEditions: shop.cardEditions,
        remainingCount: shop._count.cardEditions,
        salesCount: shop.salesCount,
      };

      return newShop;
    });
    const userSummary = { COMMON: 0, RARE: 0, 'SUPER RARE': 0, LEGENDARY: 0 };
    totalEditions.forEach((edition) => (userSummary[edition.card.grade] += 1));

    const result = { cards: newShops, userSummary, totalEditions };
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// 마이갤러리 카드 상세 조회
async function getMyCardOfGallery(req, res, next) {
  try {
    const userId = req.userId;
    const cardId = req.params.cardId;

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        user: { select: { nickname: true } },
        name: true,
        genre: true,
        grade: true,
        description: true,
        price: true,
        imgUrl: true,
        cardEditions: true,
        _count: {
          select: {
            cardEditions: { where: { userId, status: 'inPossesion' } },
          },
        },
      },
    });

    const resData = {
      id: card.id,
      name: card.name,
      imgUrl: card.imgUrl,
      nickname: card.user.nickname,
      grade: card.grade,
      genre: card.genre,
      price: card.price,
      reserveCount: card._count.cardEditions,
      description: card.description,
    };

    res.status(200).json(resData);
  } catch (error) {
    next(error);
  }
}

const cardsService = {
  createCard,
  getMyCardsOfGallery,
  getMyCardOfGallery,
  getMyCardsOfSales,
  getMyShops,
};

module.exports = cardsService;
