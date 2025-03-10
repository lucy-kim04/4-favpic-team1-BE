const prisma = require('../../db/prisma/client');

/**
 * 알림 보내기
 */
async function sendNotification(req, res, next) {
  try {
    const loginUserId = req.userId;
    const { notificationCase, grade, name, userId, shopId, purchaseCount } =
      req.body;

    const user = await prisma.user.findUnique({
      where: { id: loginUserId },
    });
    const nickname = user.nickname;

    let data;
    switch (notificationCase) {
      // acceptExchange: 상대가 내 교환 제안을 수락(교환 성사) -> 교환된 카드 확인을 위해 '마이갤러리'로 이동
      // 내가 교환을 제안한 상대방이 '승인하기'를 성공했을 때 실행
      case 'approveExchange':
        data = {
          userId,
          message: `${nickname}님과의 [${grade} | ${name}]의 포토카드 교환이 성사되었습니다.`,
          link: '/my-cards/gallery',
        };
        break;
      // refuseExchange: 상대가 내 교환 제안을 거절(교환 불발) -> 불발된 카드 확인을 위해 '나의 판매 포토카드'로 이동
      // 내가 제안한 상대방이 '거절하기'를 성공했을 때 실행
      case 'refuseExchange':
        data = {
          userId,
          message: `${nickname}님과의 [${grade} | ${name}]의 포토카드 교환이 불발되었습니다.`,
          link: '/my-cards/sales',
        };
        break;
      // arriveProposal: 누군가 나에게 교환을 제안 -> 교환 제안이 온 카드가 있는 상점으로 이동
      // 누군가가 내 상점에서 '포토카드 교환하기'를 성공했을 때 실행
      case 'arriveProposal':
        data = {
          userId,
          message: `${nickname}님이 [${grade} | ${name}]의 포토카드 교환을 제안했습니다.`,
          link: `/${shopId}`,
        };
        break;
      // purchaseCard: 내가 포토 카드 구매를 완료 -> 구매한 카드 확인을 위해 '마이갤러리'로 이동
      // 내가 '포토카드 구매하기'를 성공했을 때 실행
      case 'purchaseCard':
        data = {
          userId: loginUserId,
          message: `[${grade} | ${name}] ${purchaseCount}장을 성공적으로 구매했습니다.`,
          link: '/my-cards/gallery',
        };
        break;
      // soldMyCard: 내 상점의 포토 카드가 판매됨 -> 해당 상점으로 이동
      // 누군가가 내 상점의 포토 카드 구매를 성공했을 때 실행
      case 'soldMyCard':
        data = {
          userId,
          message: `${nickname}님이 [${grade} | ${name}]을(를) ${purchaseCount}장 구매했습니다.`,
          link: `/${shopId}`,
        };
        break;
      // soldOut: 내 상점의 포토 카드가 품절 -> 해당 상점으로 이동
      // 누군가가 내 상점의 포토 카드 구매를 성공했을 때, 내 상점의 cardEditions가 0이면 실행
      case 'soldOut':
        data = {
          userId,
          message: `[${grade} | ${name}]이(가) 품절되었습니다.`,
          link: `/${shopId}`,
        };
        break;
    }

    const notification = await prisma.notification.create({
      data,
      select: { id: true, createdAt: true, message: true, link: true },
    });

    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
}

// 나의 알림 목록 조회
async function getNotificationsOfMe(req, res, next) {
  try {
    const userId = req.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
}

// 알림(들)을 읽음으로 변경
async function setToTrueIsReadOfNotifications(req, res, next) {
  try {
    const { idsForSet } = req.body;

    const setToTruePromises = idsForSet.map(
      async (id) =>
        await prisma.notification.update({
          where: { id },
          data: { isRead: true },
        })
    );

    await Promise.all(setToTruePromises);

    res.status(200).res('SetToTrueIsRead success');
  } catch (error) {
    next(error);
  }
}

// 특정 알림을 읽음으로 변경
async function setToTrueIsReadOfNotification(req, res, next) {
  try {
    console.log(req.params);
    const id = req.params.notificationId;
    console.log(id);

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).send('SetToTrueIsRead success');
  } catch (error) {
    next(error);
  }
}

const notificationsService = {
  sendNotification,
  getNotificationsOfMe,
  setToTrueIsReadOfNotifications,
  setToTrueIsReadOfNotification,
};

module.exports = notificationsService;
