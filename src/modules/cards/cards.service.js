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

    // 카드 생성
    const card = await prisma.card.create({ data });

    // 카드 에디션 생성
    for (let i = 0; i < card.issuedQuantity; i++) {
      const editionData = {
        userId,
        cardId: card.id,
        number: i + 1,
      };
      await prisma.cardEdition.create({ data: editionData });
    }

    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
}

// 나의 갤러리 카드 목록 조회
async function getMyCardsOfGallery(req, res, next) {
  try {
    const userId = req.userId;

    const cardIds = await prisma.cardEdition.groupBy({
      where: { userId },
      by: ['cardId'],
    });
    const cardIdsArray = cardIds.map((cardId) => cardId.cardId);
    const cards = await prisma.card.findMany({
      where: { id: { in: cardIdsArray } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        genre: true,
        grade: true,
        description: true,
        price: true,
        imgUrl: true,
        _count: { select: { cardEditions: { where: { id: userId } } } },
      },
    });
    res.status(200).json(cards);
  } catch (error) {
    next(error);
  }
}

const cardsService = {
  createCard,
  getMyCardsOfGallery,
};

module.exports = cardsService;
