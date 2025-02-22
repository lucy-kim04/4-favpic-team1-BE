const prisma = require('../../db/prisma/client');

// 상점에서 카드 구매하기
async function purchaseCards(req, res, next) {
  try {
    const { shopId, purchaseCount, price } = req.body;

    // #1. 상점의 잔여 수량이 구매 수량 이상인지 확인하기
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        salesCount: true,
        cardEditions: { orderBy: { number: 'asc' } },
      },
    });
    const salesCount = shop.salesCount;
    if (purchaseCount > salesCount)
      throw new Error('400/Not sufficient quantity');

    // #2. 보유 포인트가 총 가격 이상인지 확인하기
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { point: true },
    });
    const totalAmount = purchaseCount * price;

    if (totalAmount > user.point) throw new Error('400/Not sufficient point');

    // #3. 구매 로직 수행
    // 3-1. 상점 에디션들 중 구매 수량만큼 에디션을 뽑아서 id 배열로 만들기
    // 3-2. 판매한 에디션들의 정보 업데이트하기
    // - 상점 ID 삭제
    // - 소유자 ID를 구매자 변경
    // - 상태를 inPossesion으로 변경
    // 3-3. 상점 정보 업데이트하기
    // - salesCount에서 purchaseCount 차감
    // 3-4. 사용자 정보 업데이트하기
    // - 구매자: totalAmount만큼 포인트 차감
    // - 판매자: totalAmount만큼 포인트 증가
    // 3-5. 구매 정보(테이블) 생성
    // - 데이터: buyerId, sellerId, cardId, cardEditions, price, purchaseCount

    // 3-3.
  } catch (error) {
    next(error);
  }
}

const purchasesService = {};

module.exports = purchasesService;
