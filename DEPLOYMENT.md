# GitHub Pages 배포 가이드

## 1. GitHub 저장소 생성

1. [GitHub](https://github.com)에 로그인합니다
2. "New repository" 버튼을 클릭합니다
3. 저장소 이름을 입력합니다 (예: `realtime-voting-app`)
4. Public으로 설정합니다
5. "Create repository"를 클릭합니다

## 2. 프로젝트를 GitHub에 업로드

### Git 초기화 및 커밋
```bash
git init
git add .
git commit -m "Initial commit"
```

### GitHub 저장소 연결 및 푸시
```bash
git remote add origin https://github.com/[your-username]/[your-repo-name].git
git branch -M main
git push -u origin main
```

## 3. package.json 설정 수정

`package.json` 파일에서 `homepage` 필드를 실제 GitHub 정보로 수정합니다:

```json
{
  "homepage": "https://[your-github-username].github.io/[your-repo-name]"
}
```

예시:
```json
{
  "homepage": "https://john-doe.github.io/realtime-voting-app"
}
```

## 4. gh-pages 패키지 설치

```bash
npm install --save-dev gh-pages
```

## 5. 배포 실행

```bash
npm run deploy
```

## 6. GitHub Pages 설정

1. GitHub 저장소 페이지로 이동합니다
2. "Settings" 탭을 클릭합니다
3. 왼쪽 메뉴에서 "Pages"를 클릭합니다
4. "Source" 섹션에서 "Deploy from a branch"를 선택합니다
5. "Branch" 드롭다운에서 "gh-pages"를 선택합니다
6. "Save"를 클릭합니다

## 7. 배포 확인

몇 분 후에 `https://[your-username].github.io/[your-repo-name]`에서 앱을 확인할 수 있습니다.

## 주의사항

- Firebase 설정이 올바르게 되어 있어야 합니다
- `src/firebase/config.js`의 Firebase 설정이 정확해야 합니다
- GitHub 저장소는 Public이어야 합니다
- 배포 후 몇 분 정도 기다려야 사이트가 활성화됩니다

## 문제 해결

### 배포가 안 되는 경우
1. `package.json`의 `homepage` 필드가 올바른지 확인
2. GitHub 저장소 이름과 사용자명이 정확한지 확인
3. `npm run deploy` 명령어가 성공적으로 실행되었는지 확인

### Firebase 연결 오류
1. Firebase Console에서 Authentication > Sign-in method에서 "Anonymous" 인증을 활성화
2. Firestore Database > Rules에서 읽기/쓰기 권한 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 업데이트 배포

코드를 수정한 후 다시 배포하려면:

```bash
git add .
git commit -m "Update app"
git push
npm run deploy
``` 