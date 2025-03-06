# 🐈 코드잇 스프린트 풀스택 4기 - 중급 프로젝트 1팀 🫶🏻

<pre>
   _        ______                                  
 /' \      /\__  _\                                 
/\_, \     \/_/\ \/     __      __       ___ ___    
\/_/\ \       \ \ \   /'__`\  /'__`\   /' __` __`\  
   \ \ \       \ \ \ /\  __/ /\ \L\.\_ /\ \/\ \/\ \ 
    \ \_\       \ \_\\ \____\\ \__/.\_\\ \_\ \_\ \_\
     \/_/        \/_/ \/____/ \/__/\/_/ \/_/\/_/\/_/
/**
*                🍄 1 TEAM PROJECT
*            🛠️ 최애의 포토 - FavPic
*            ⏰ 2025.02.11 ~ 2025.03.07
**/
</pre>

> 💻 '최애의 포토' 바로가기 👉🏻 [Click ](https://4-favpic-team1-fe.vercel.app/)

#### 목차

- [Team Members](#t1)
- [Project Information](#t2)
- [기술 스택](#t3)
- [팀원별 구현 기능 상세](#t4)
- [파일 구조](#t5)
- [구현 홈페이지](#t6)
- [회고록](#t7)

## Team Members<a id="t1"></a>

| 이름   | 개인 개발 보고서                                                                    |
| ------ | ----------------------------------------------------------------------------------- |
| 김주영 | [노션 링크 바로가기]|
| 김희주 | [노션 링크 바로가기](https://www.notion.so/kirinnim-p/1aeaf99f71f880b6b16bc926eda0fa84?pvs=25) |
| 정진호 | [노션 링크 바로가기]|
| 조형민 | [노션 링크 바로가기](https://www.notion.so/kirinnim-p/19aaf99f71f880b0a458eb8058f200c1?pvs=25) |

## Project Information<a id="t2"></a>

### 개인용 디지털 사진첩 생성 플랫폼, 최애의 포토

| Title        | 개인용 디지털 사진첩 생성 플랫폼, 최애의 포토                                                                                                                                                                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Description  | "최애의 포토"는 디지털 시대의 새로운 수집 문화를 선도하는 플랫폼입니다. 자신이 좋아하는 아이돌이나 스포츠 스타, 그림 등 디지털 포토카드를 손쉽게 사고팔 수 있는 공간으로, 특별한 커뮤니티를 제공합니다. 이제는 좋아하는 포토카드를 실제로 모으는 것뿐만 아니라, 디지털 자산으로 소장하며 나만의 컬렉션을 완성할 수 있습니다. 서로의 포토카드를 교환하고, 나만의 포토카드를 자랑하는 재미와 함께 상호 교류도 즐길 수 있는 플랫폼, "최애의 포토"에서 만나보세요! |
| Project Link | Git Url : [FavPic 프론트엔드](https://github.com/lucy-kim04/4-favpic-team1-FE) ,  [FavPic 백엔드](https://github.com/lucy-kim04/4-favpic-team1-BE)                                                                                                                                                                                                                       |

## 기술 스택<a id="t3"></a>

| Frontend                                                   | Backend                                                        | Database                       | 협업툴                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------ | ----------------------------------------- |
| - JavaScript</br>- Next.js</br>- Tanstack Query</br>- Tailwind CSS</br>- React Hook Form</br>- clsx</br>- Axios</br>- Atomic 디자인 패턴 적용</br>- Vercel(배포) | - Express.js</br>- cors, bcrypt, dotenv, morgan, validator, jsonwebtoken, multer<br>- Render(배포) | - postgreSQL</br>- prisma(ORM) | - 협업툴<br>  - Git & Github</br>  - Discord</br>  - Notion<br>- 유저 인증 구현<br>  - 토큰/헤더 방식<br>  - JWT 사용 |

## 아키텍처 다이어그램

<img width="727" alt="image" src="https://github.com/user-attachments/assets/a8934f28-217b-4af7-8fa2-b35c8c9b4cad" />


## 팀원별 역할 및 구현 기능 상세<a id="t4"></a>

#### [김주영 - 바로가기](#a-1)

#### [김희주 - 바로가기 ](#a-3)

#### [정진호 - 바로가기 ](#a-4)

#### [조형민 - 바로가기](#a-6)

---

### 🍄 김주영<a id="a-1"></a>

#### 적어주세요

1. 역할
2. 구현 내용
  1. 프론트엔드
  2. 백엔드   

---

### 🍄 김희주<a id="a-3"></a>

#### 적어주세요

1. 역할
2. 구현 내용
  1. 프론트엔드
  2. 백엔드   

---
### 🍄 정진호<a id="a-4"></a>

#### 적어주세요

1. 역할
2. 구현 내용
  1. 프론트엔드
  2. 백엔드   

---

### 🍄 조형민<a id="a-6"></a>

#### 적어주세요

1. 역할
2. 구현 내용
  1. 프론트엔드
  2. 백엔드   

---

## 파일 구조<a id="t5"></a>

### 🍄 프론트엔드 폴더 구조

<img width="219" alt="image" src="https://github.com/user-attachments/assets/09e11cfd-7750-4123-93a9-5d7f33b818b7" />

### 🍄 백엔드 폴더 구조

<img width="250" alt="image" src="https://github.com/user-attachments/assets/20566cfe-cd7d-4ef9-99a7-ceec3e507257" />

## DB 모델링

![FavPic](https://github.com/user-attachments/assets/4ba78313-2819-45cd-863e-d0b67199ead7)

## API 명세

## /users

- 회원가입
    - [POST] /users/sign-up
- 로그인
    - [POST] /users/log-in
- 토큰 갱신
    - [POST] /users/refreshToken
- 닉네임 중복 체크
    - [POST] /users/check-nickname
- 내 프로필(정보) 조회
    - [GET] /users/me
- 내 포인트 조회
    - [GET] /users/me
- 마이갤러리 목록 조회
    - [GET] /users/me/gallery-summary
- 나의 판매 포토카드 목록 조회
    - [GET] /users/me/gallery-sales
 
## /cards

- 내가 소유중인 카드 목록 조회 - 마이갤러리
    - [GET] /cards/me/gallery
- 마이갤러리 카드 상세 조회
    - [GET] /cards/me/gallery/:cardId
- 나의 판매 포토카드 목록 조회(판매중 또는 교환 제시 중)
    - [GET] /cards/me/sales
- 카드 등록(발행)
    - [POST] /cards

## /shops

- 마켓플레이스에 등록된 전체 상점 목록 조회
    - [GET] /shops
- 내 포토 카드 판매(상점 등록)
    - [POST] /shops
- 상점 상세 조회
    - [GET] /shops/:shopId
- 상점 정보 수정
    - [PUT] /shops/:shopId
- 상점 삭제(판매 내리기)
    - [DELETE] /shops/:shopId
- 상점에 등록된 포토 카드 구매
    - [POST] /shops/:shopId/purchase
- 상점에 등록된 포토 카드에 교환 제안
    - [POST] /shops/:shopId/exchanges
- (상점에 등록된) 포토 카드 교환 제안 취소
    - [PUT] /exchanges/:exchangeId
- (상점에 등록된) 포토 카드 교환 신청 승인
    - [POST] /exchanges/:exchangeId/approve
- (상점에 등록된) 포토 카드 교환 신청 거절
    - [POST] /exchanges/:exchangeId/refuse

## /notifications

- 알림 추가
    - [POST] /notifications
- 나의 알림 목록 조회
    - [GET] /notifications/me
- 알림 정보 수정(읽음 처리)
    - [GET] /notifications/:notificationId


## 프로젝트 회고록<a id="t7"></a>
