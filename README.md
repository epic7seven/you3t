# SubFeed PWA

구독 채널의 새 영상 제목과 채널명을 날짜별로 확인하는 개인용 PWA.

## 현재 구현
- 하단 탭: 알림 / 채널 / 계정 / 설정
- Google OAuth를 통한 YouTube 구독 목록 조회
- 채널별 알림 활성/비활성
- 직접 카테고리 생성/삭제 및 채널 다중 분류
- 날짜별 업로드 목록, 영상 제목 클릭 시 영상 URL 열기
- `⋮` 메뉴에서 URL 복사
- 라이트/다크 테마
- 브라우저 알림(앱을 열어 새로 확인할 때 감지)

## 준비
1. Google Cloud Console에서 프로젝트 생성
2. YouTube Data API v3 사용 설정
3. OAuth 동의 화면 구성 및 OAuth Client ID 생성 (웹 애플리케이션)
4. GitHub Pages 주소를 OAuth의 Authorized JavaScript origins에 등록
5. 앱 설정 탭에 Client ID 입력

OAuth scope: `https://www.googleapis.com/auth/youtube.readonly`

## GitHub Pages
저장소에 파일을 올린 뒤 Settings → Pages → Deploy from branch → main / root 설정.
사이트가 배포되면 OAuth 설정에 배포 주소를 등록해야 함.

## 한계 및 주의
- YouTube API 할당량 때문에 채널 수가 많으면 매번 전체 확인은 부담이 될 수 있음.
- 현재 버전은 앱이 열려 있을 때 새 영상 확인을 수행. 앱이 완전히 종료된 상태에서 정기 푸시 알림은 서버/푸시 시스템이 추가로 필요.
- OAuth Client ID와 API 키를 개인 프로젝트에서만 사용하고, API 키에는 가능한 한 웹사이트 제한을 설정할 것.
- Google 계정 토큰은 현재 세션에서 사용하며, 연결 해제 시 앱 내 채널/영상 목록도 비워짐.
