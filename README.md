# 📷 Hasselblad 100MP Virtual Camera Experience
### 핫셀블라드 1억 화소 중형 카메라 가상 체험 시뮬레이터 🇸🇪

> **"천만원이 넘는 핫셀블라드 1억 화소 카메라... 가상으로라도 그 미친 해상력과 셔터 감성을 체감할 수 없을까?"**  
> 유튜브 쇼츠와 인스타그램 릴스에서 전 세계를 놀라게 한 **100MP 초고해상도 딥 줌(Deep Zoom)**과 핫셀블라드 특유의 **리프 셔터(Leaf Shutter) 기계음**을 브라우저에서 직접 조작하고 체감할 수 있는 인터랙티브 가상 카메라 웹 시뮬레이터입니다.

---

## ✨ 주요 핵심 기능 (Key Features)

### 1. 🔍 1억 4,200만 화소 무한 딥 줌 (142MP Gigapixel Engine)
- OpenSeadragon 타일 피라미드 엔진 탑재.
- **피렌체 두오모 대성당 광장 (13,920 × 10,200 픽셀, 1억 4천만 화소)**:
  - 수백 미터 밖 청동 돔 랜턴의 리벳, 광장 속 자전거 바퀴살, 고딕 양식 대리석 조각까지 1:1 픽셀 단위로 선명하게 확대.
- **미 의회 도서관 돔 (7,026 × 9,221 픽셀, 6,500만 화소)**.
- **내 고화질 사진 열기**: 사용자의 대용량 사진도 브라우저에서 직접 딥 줌으로 탐색 가능.

### 2. 🎬 쇼츠/릴스 감성의 "100MP 디테일 시네마틱 투어"
- 클릭 한 번으로 전체 구도에서 100미터 밖 극소 디테일까지 부드럽게 줌인되는 자동 연출 투어 모드.
- 각 포인트마다 카메라 스펙과 디테일 설명 자막 제공.

### 3. 🔊 Web Audio 기반 리프 셔터(Leaf Shutter) & 다이얼 사운드
- 일반 미러리스나 DSLR의 포컬 플레인 셔터와 다른, 핫셀블라드 XCD 렌즈 셔터 특유의 묵직하고 정숙한 **"착-츳" 메카니컬 리프 셔터음**을 Web Audio API로 정밀 합성.
- 셔터 릴리즈 시 순간 암전(Blackout) 및 플래시, 모바일 햅틱 진동 연동.
- 정밀 CNC 널링 다이얼을 돌릴 때의 미세한 금속 클릭 사운드.

### 4. 🎛️ 핫셀블라드 시그니처 하드웨어 UI (CFV 100C & X2D 100C)
- **Top OLED 서브 디스플레이**: 상단 상태창에서 조리개, 셔터, ISO, 1TB 내장 SSD 잔여 컷수, 실시간 줌 배율 표시.
- **노출 시뮬레이션**: 조리개(f/2.5 ~ f/22), 셔터(1/4000s ~ 1s), ISO(64 ~ 25600), EV 보정에 따른 실시간 뷰파인더 광학 밝기 반응.
- **HNCS (Hasselblad Natural Colour Solution)** 16비트 컬러 프로파일 및 흑백 모노크롬 모드.
- **전설적인 XPan (65:24 파노라마)** 및 **1:1 정방형 중형 포맷** 프레이밍 마스크.
- **907X 웨이스트 레벨 파인더 틸트 스크린 (0° ~ 40° 3D 뷰)**.
- 포커스 피킹(Focus Peaking) 및 실시간 RGB 히스토그램.

### 5. 🏷️ 핫셀블라드 공식 갤러리 EXIF 카드 내보내기
- 현재 줌/팬 된 디테일 샷과 전체 구도를 비교할 수 있는 **PIP(Picture-in-Picture) 미니맵** 내장.
- 하단에 핫셀블라드 공식 스타일 로고와 촬영 파라미터(EXIF)가 각인된 프레임 카드 JPG 즉시 저장 및 공유.

### 6. 🇸🇪 "Dear Hasselblad Sweden..." 바이럴 청원 캠페인
- "핫셀블라드 본사 직원분들 보고 계신가요? 이 사이트가 대박나면 열정적인 개발자에게 카메라 한 대 선물해주세요!" 유쾌한 메시지와 트위터/SNS 원클릭 공유.

---

## 🚀 빠른 시작 (Quick Start)

별도의 백엔드 설치 없이, 최신 웹 브라우저만 있으면 즉시 실행 가능합니다.

```bash
# 1. 저장소 클론
git clone https://github.com/lovefunky216-boop/Camera_Simulator.git

# 2. 디렉토리 이동
cd Camera_Simulator

# 3. 브라우저에서 index.html 바로 열기 (또는 로컬 웹서버 실행)
# Python 로컬 서버 실행 예시:
python -m http.server 8000
```
브라우저에서 `http://localhost:8000`으로 접속하여 핫셀블라드 1억 화소를 체감해보세요!

---

## ☁️ Cloudflare Workers 자동 배포 (CI/CD)

Cloudflare Workers의 **Static Assets** 기능과 GitHub이 연동되어 있어, `git push`를 하면 자동으로 빌드 및 글로벌 엣지 CDN에 반영됩니다.

### 방법 1: Cloudflare 대시보드에서 Git 연동 (가장 간편한 방법)
1. [Cloudflare Workers Deployments 페이지](https://dash.cloudflare.com/a2ac61f5f73089be223a143af71ad7d4/workers/services/view/camera-simulator/production/deployments)로 이동합니다.
2. 상단 메뉴의 **Settings** > **Builds** (또는 **Connect to Git**)를 클릭합니다.
3. GitHub 계정을 연결하고 `lovefunky216-boop/Camera_Simulator` 저장소를 선택합니다.
4. **Deploy**를 클릭하면 완료! 이후 `git push` 시마다 Cloudflare가 자동으로 빌드 & 배포합니다.

### 방법 2: GitHub Actions 워크플로우 활용
1. 본 저장소의 **Settings** > **Secrets and variables** > **Actions**로 이동합니다.
2. `CLOUDFLARE_API_TOKEN` 시크릿을 생성하고 발급받은 Cloudflare API 토큰을 입력합니다.
3. 이제 `main` 브랜치에 코드를 올리면 `.github/workflows/deploy.yml`이 실행되어 자동으로 배포됩니다.

---

## 🌐 GitHub Pages 무료 웹 배포 방법

이 프로젝트를 GitHub Pages로도 동시에 호스팅할 수 있습니다:
1. GitHub 저장소(`Camera_Simulator`)의 **Settings** 탭으로 이동합니다.
2. 좌측 메뉴의 **Pages**를 클릭합니다.
3. **Build and deployment** > **Branch**에서 `main` 브랜치 / `/(root)`를 선택하고 **Save**를 누릅니다.
4. 1~2분 후 `https://lovefunky216-boop.github.io/Camera_Simulator/` 주소로 전 세계에 실시간 서비스됩니다!

---

## 🎮 단축키 및 제스처 가이드

| 입력 | 동작 |
| :--- | :--- |
| **마우스 휠 / 핀치 줌** | 부드러운 딥 줌 (0% ~ 1500%+) |
| **더블 클릭 / 탭** | 해당 위치로 자동 초점 줌 |
| **드래그** | 1억 화소 전경 패닝 탐색 |
| **스페이스바 또는 셔터 버튼** | 리프 셔터 격발 & 사진 카드 생성 |

---

## 📜 라이선스 (License)
MIT License · Hasselblad는 Victor Hasselblad AB의 등록 상표이며, 본 프로젝트는 팬 메이드 가상 체험 시뮬레이터입니다.
