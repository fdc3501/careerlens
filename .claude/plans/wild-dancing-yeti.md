# 이력서 파싱 구현 계획

## Context
현재 Upload 페이지는 이력서를 업로드해도 mock 데이터(하드코딩된 Software Engineer/3yr)를 사용한다.
개발문서 섹션 9에 정의된 이력서 파싱을 구현하여, 실제 PDF/DOCX에서 CareerInput을 추출한다.
결제 전 단계이므로 유료 API 없이 클라이언트 사이드에서 룰 기반으로 처리한다.

## 아키텍처

```
이력서 업로드(Upload.tsx)
  → 클라이언트 텍스트 추출 (pdfjs-dist / mammoth)
  → 룰 기반 파싱 (섹션분리 → 스킬추출 → 연차계산 → 직무분류)
  → CareerInput 생성
  → generateAnalysis(무료 API) → Preview
```

## 변경 파일

### 1. `npm install` — 의존성 추가
- `pdfjs-dist` — PDF 텍스트 추출 (브라우저 호환)
- `mammoth` — DOCX → 텍스트 변환 (브라우저 호환)

### 2. `src/lib/resumeParser.ts` (신규) — 이력서 파싱 모듈

**텍스트 추출:**
- `extractTextFromPDF(file: File): Promise<string>` — pdfjs-dist 사용
- `extractTextFromDOCX(file: File): Promise<string>` — mammoth 사용
- `extractText(file: File): Promise<string>` — MIME 타입으로 분기

**섹션 분리:**
- Experience / Education / Skills / Projects 키워드 기반 정규식
- 한국어/영어 키워드 모두 지원 (경력사항, 기술스택, 학력, 프로젝트 등)

**기술 스택 추출:**
- 사전 정의 Skill Dictionary (JSON 객체)
  - 프론트엔드: React, Vue, Angular, TypeScript, JavaScript, HTML, CSS, Next.js, Svelte 등
  - 백엔드: Node.js, Python, Java, Go, Ruby, PHP, Spring, Django, Express 등
  - 데이터: SQL, PostgreSQL, MongoDB, Redis, Elasticsearch 등
  - 인프라: AWS, Docker, Kubernetes, CI/CD, Terraform 등
- 소문자 정규화 후 매칭
- Levenshtein distance ≤ 1 허용 (간단 구현)

**경력 연차 계산:**
- 날짜 패턴 추출: `YYYY.MM`, `YYYY-MM`, `YYYY년 MM월` 등
- 시작~종료 기간 합산
- 패턴 매칭 실패 시 → 숫자+"년"/"year" 패턴 fallback

**직무 분류:**
- 추출된 기술 스택 기반 룰 매핑
  - React/Vue/Angular 다수 → Frontend Developer
  - Node.js/Python/Java + DB → Backend Developer
  - 프론트+백 혼합 → Full Stack Developer
  - Python + ML/AI 키워드 → Data Scientist / ML Engineer
  - AWS/Docker/K8s 다수 → DevOps Engineer
  - fallback → Software Engineer

**최종 출력:**
- `parseResume(file: File): Promise<CareerInput>` — 통합 함수
- 반환: `{ jobTitle, experience, skills, industry, goal }`
- goal은 빈 문자열 (사용자가 직접 설정해야 할 영역)

### 3. `src/pages/Upload.tsx` 수정
- mock 데이터 제거
- `handleAnalyze`에서 `parseResume(file)` 호출
- 파싱 중 로딩 상태 표시
- 파싱 실패 시 에러 메시지 표시
- 파싱 성공 후 → 결과 확인/수정 UI (선택) 또는 바로 분석 진행

### 4. `src/i18n.ts` 수정
- upload 섹션에 파싱 관련 문구 추가 (파싱 중, 파싱 실패 등)

## Skill Dictionary 범위 (주요 항목)
```
Frontend: React, Vue, Angular, Svelte, Next.js, Nuxt, TypeScript, JavaScript, HTML, CSS, Sass, Tailwind
Backend: Node.js, Express, NestJS, Python, Django, Flask, FastAPI, Java, Spring, Go, Ruby, Rails, PHP, Laravel
Database: SQL, MySQL, PostgreSQL, MongoDB, Redis, DynamoDB, Elasticsearch
Infra/DevOps: AWS, GCP, Azure, Docker, Kubernetes, Terraform, Jenkins, GitHub Actions, CI/CD
Mobile: React Native, Flutter, Swift, Kotlin, iOS, Android
Data/ML: TensorFlow, PyTorch, Pandas, NumPy, Scikit-learn, Spark, Hadoop
```

## 검증
- `npm run build` 성공
- PDF 이력서 업로드 → 기술 스택/연차/직무 정상 추출 확인
- DOCX 이력서 업로드 → 동일 확인
- 파싱 불가 파일 → 에러 메시지 표시 확인
- 파싱 결과 → Preview/Report까지 정상 전달 확인
