const prisma = require('../../db/prisma/client');

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
async function getMyCardsOfSales(req, res, next) {
  try {
    const userId = req.userId;

    const {
      orderBy: queryOrderBy,
      grade: queryGrade,
      genre: queryGenre,
      onSale,
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
      console.log(cardIdsArray);
      const cards = await tx.card.findMany({
        where: {
          id: { in: cardIdsArray },
          cardEditions: { some: { status: 'onSales' } },
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
            where: { userId, status: 'onSales' },
            select: { card: { select: { grade: true, id: true, name: true } } },
          },
          price: true,
          imgUrl: true,
          _count: {
            select: {
              cardEditions: { where: { userId, status: 'onSales' } },
            },
          },
        },
      });

      return cards;
    });

    const totalEditions = [];
    const newCards = cards.map((card) => {
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
        // reserveCount: card._count.cardEditions,
        remainingCount: card._count.cardEditions,
      };

      return newCard;
    });
    const userSummary = { COMMON: 0, RARE: 0, 'SUPER RARE': 0, LEGENDARY: 0 };
    totalEditions.forEach((edition) => (userSummary[edition.card.grade] += 1));

    const result = { cards: newCards, userSummary, totalEditions };

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
};

module.exports = cardsService;
