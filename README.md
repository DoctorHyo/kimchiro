# 김치로 온라인 버전

GitHub에 소스를 보관하고 Vercel에 배포하며 Supabase에 가게와 제보를 저장합니다. 기존 로컬 버전은 별도 폴더에 남아 있습니다.

## 연결 준비

1. Supabase 프로젝트를 만들고 SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
2. Authentication에서 운영자 사용자를 생성합니다. 사용자 가입은 비활성화하고, 생성된 사용자 UUID를 확인해 SQL Editor에서 다음을 실행합니다. UUID는 실제 값으로 바꾸세요.

   `insert into public.app_admins (user_id) values ('운영자-UUID');`

3. GitHub에 이 폴더를 저장소로 올리고 Vercel에서 가져옵니다. Vercel 환경 변수로 Supabase 프로젝트 URL을 `SUPABASE_URL`에, **publishable key 또는 legacy anon key**를 `SUPABASE_PUBLISHABLE_KEY`에 넣습니다. 이 값들은 브라우저에 공개되는 값입니다. service_role key나 secret key는 절대 넣지 마세요.
4. Vercel에서 빌드하고 배포합니다. 환경 변수를 변경했다면 다시 배포해야 합니다.

사이트의 운영자 메뉴에서 해당 계정으로 로그인하면 가게 등록 및 제보 검토를 할 수 있습니다. 가게 원산지는 공공데이터에서 확인할 수 없으므로 근거와 확인일을 직접 확인해야 합니다.

## 운영 주의

- 공개 제보는 누구나 등록할 수 있고 현재 별도의 자동 스팸 방지나 사용량 제한은 없습니다. 실제 공개 전 접근량 제한이나 CAPTCHA 등을 추가하고 사용량을 모니터링하세요.
- 데이터베이스 접근 권한은 SQL의 RLS 정책으로 제한됩니다. 운영자 UUID를 추가하기 전까지는 아무도 관리할 수 없습니다.
- Supabase 사용자 가입을 끄고 강력한 암호를 사용하세요. DB 공급자의 백업 정책과 요금제 및 사용량을 확인하고 주기적으로 가게 데이터 백업을 내려받으세요.
- 주소 검색은 외부 Nominatim 서비스에 입력한 가게 주소를 전송합니다. 지도 타일은 OpenStreetMap을 사용합니다.
- 기존 로컬 버전에 등록한 자료는 별도입니다. 운영자 메뉴에서 백업을 보관한 뒤 온라인 버전에 다시 등록하세요.

