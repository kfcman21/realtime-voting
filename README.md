# 실시간 공감투표 앱

Firebase 기반의 실시간 공감투표 웹 애플리케이션입니다.

## 주요 기능

- 🎯 **주제 추가**: 다양한 주제를 입력할 수 있습니다
- 💬 **답변 추가**: 각 주제에 대한 답변을 추가할 수 있습니다
- 👍 **실시간 투표**: 답변에 실시간으로 투표할 수 있습니다
- 📊 **실시간 업데이트**: Firebase를 통한 실시간 데이터 동기화
- 🔒 **비밀번호 초기화**: 관리자 비밀번호로 전체 데이터 초기화 가능
- 🎨 **모던 UI**: Material-UI를 사용한 깔끔한 인터페이스

## 기술 스택

- **Frontend**: React 18
- **UI Framework**: Material-UI (MUI)
- **Backend**: Firebase Firestore
- **실시간 통신**: Firebase Realtime Database
- **라우팅**: React Router

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트를 생성합니다
2. Firestore Database를 활성화합니다
3. `src/firebase/config.js` 파일에서 Firebase 설정을 업데이트합니다:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. 앱 실행

```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 접속하면 앱을 사용할 수 있습니다.

## 사용 방법

### 주제 추가
1. 상단의 "주제를 입력하세요" 필드에 주제를 입력합니다
2. "추가" 버튼을 클릭하거나 Enter 키를 누릅니다

### 답변 추가
1. 주제 카드의 "답변 추가" 버튼을 클릭합니다
2. 답변을 입력하고 "추가" 버튼을 클릭합니다

### 투표하기
1. 원하는 답변 옆의 👍 버튼을 클릭합니다
2. 투표 수가 실시간으로 업데이트됩니다

### 초기화
1. 우하단의 "초기화" 버튼을 클릭합니다
2. 비밀번호 `admin123`을 입력합니다
3. 모든 데이터가 삭제됩니다

## 프로젝트 구조

```
src/
├── components/
│   └── VotingApp.js          # 메인 앱 컴포넌트
├── firebase/
│   └── config.js             # Firebase 설정
├── App.js                     # 앱 루트 컴포넌트
└── index.js                   # 앱 진입점
```

## Firebase 데이터 구조

### topics 컬렉션
```javascript
{
  id: "문서ID",
  title: "주제 제목",
  answers: [
    {
      text: "답변 내용",
      votes: 0
    }
  ],
  createdAt: "생성 시간"
}
```

## 주의사항

- Firebase 프로젝트 설정이 올바르게 되어 있어야 합니다
- Firestore 보안 규칙을 적절히 설정해야 합니다
- 초기화 비밀번호는 `admin123`으로 설정되어 있습니다

## 라이선스

MIT License 