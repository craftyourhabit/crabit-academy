#!/usr/bin/env node
/* =====================================================================
   크래빗 아카데미 - 솔라피 알림톡 템플릿 도구

   카카오 알림톡 템플릿을 등록하고 검수(승인)를 요청합니다.
   솔라피 Node SDK 에는 검수 요청이 빠져 있어서 REST 를 직접 부릅니다.

   【키는 환경변수로만 받습니다】
   API Secret 을 명령문에 적으면 셸 기록에 남습니다.
   아래처럼 앞에 붙여서 실행하거나, admin/.solapi.env 에 넣어 두세요.
   (.solapi.env 는 .gitignore 에 있어 레포에 올라가지 않습니다)

     SOLAPI_API_KEY=... SOLAPI_API_SECRET=... node admin/solapi-template.mjs channels

   【쓰는 순서】
     1) node admin/solapi-template.mjs channels        연동된 채널과 pfId 확인
     2) node admin/solapi-template.mjs categories      카테고리 코드 확인
     3) node admin/solapi-template.mjs drafts          등록할 문안 미리보기
     4) node admin/solapi-template.mjs create <키> <pfId> <카테고리코드>
     5) node admin/solapi-template.mjs inspect <템플릿ID>   검수 요청
     6) node admin/solapi-template.mjs status <템플릿ID>    상태 확인
        node admin/solapi-template.mjs list              전체 목록

   카카오 심사는 영업일 1~3일 걸립니다.
   광고성 문구가 있으면 반려되므로 아래 문안은 정보성으로만 썼습니다.

   결제는 카카오페이로 붙일 예정이라 계좌 안내 대신 결제 버튼을 넣었습니다.
   ===================================================================== */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://api.solapi.com";
const here = path.dirname(fileURLToPath(import.meta.url));

/* admin/.solapi.env 가 있으면 읽어 옵니다. KEY=VALUE 한 줄씩. */
function loadEnvFile() {
  const f = path.join(here, ".solapi.env");
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    if (!process.env[k]) process.env[k] = t.slice(i + 1).trim();
  }
}
loadEnvFile();

const API_KEY = process.env.SOLAPI_API_KEY;
const API_SECRET = process.env.SOLAPI_API_SECRET;

if (!API_KEY || !API_SECRET) {
  console.error("SOLAPI_API_KEY 와 SOLAPI_API_SECRET 이 필요합니다.");
  console.error("솔라피 콘솔 > 개발/연동 > API Key 관리 에서 발급받으세요.");
  console.error("");
  console.error("  SOLAPI_API_KEY=... SOLAPI_API_SECRET=... node admin/solapi-template.mjs channels");
  console.error("");
  console.error("또는 admin/.solapi.env 파일에 두 줄로 적어 두셔도 됩니다.");
  process.exit(1);
}

/* 솔라피 인증 헤더.
   date + salt 를 API Secret 으로 HMAC-SHA256 해시합니다.
   Secret 자체는 절대 전송되지 않습니다. */
function authHeader() {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto.createHmac("sha256", API_SECRET).update(date + salt).digest("hex");
  return `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function call(method, url, body) {
  const res = await fetch(BASE + url, {
    method,
    headers: {
      "Authorization": authHeader(),
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.errorMessage || data.message)) || text.slice(0, 300);
    throw new Error(`${method} ${url} → ${res.status}\n${msg}`);
  }
  return data;
}

/* ---------------------------------------------------------------
   알림톡 문안

   #{변수명} 은 발송할 때 값을 채워 넣는 자리입니다.
   카카오에서 승인받은 치환문구와 이름이 정확히 같아야 하므로,
   여기서 정한 이름을 나중에 발송 코드에서도 그대로 씁니다.

   광고 표현("할인", "지금 신청", "특가")은 넣지 않습니다.
   알림톡은 정보성 메시지만 허용되고, 광고로 보이면 반려됩니다.
   --------------------------------------------------------------- */
const DRAFTS = {
  apply_confirm: {
    name: "크래빗아카데미_접수확인",
    content: [
      "안녕하세요, 원장님! 크래빗팀입니다 😊",
      "",
      "#{강의명} 신청이 잘 접수되었어요.",
      "",
      "■ 일시  #{일시}",
      "■ 진행 방식  #{진행방식}",
      "■ 수강료  #{수강료}",
      "",
      "아래 버튼에서 결제까지 마치시면 자리가 확정돼요.",
      "",
      "궁금하신 점은 언제든 편하게 연락 주세요.",
      "#{문의처}"
    ].join("\n"),
    buttons: [
      { buttonName: "결제하기", buttonType: "WL", linkMo: "#{결제링크}", linkPc: "#{결제링크}" }
    ]
  },

  payment_guide: {
    name: "크래빗아카데미_결제안내",
    content: [
      "안녕하세요, 원장님! 크래빗팀입니다 🙏",
      "",
      "#{강의명} 신청해 주셨는데",
      "아직 결제가 확인되지 않아 한 번 더 안내드려요.",
      "",
      "■ 일시  #{일시}",
      "■ 수강료  #{수강료}",
      "",
      "#{마감일}까지 결제가 확인되지 않으면",
      "신청이 자동으로 취소됩니다.",
      "혹시 사정이 있으시면 편하게 알려 주세요. 도와드릴게요.",
      "",
      "#{문의처}"
    ].join("\n"),
    buttons: [
      { buttonName: "결제하기", buttonType: "WL", linkMo: "#{결제링크}", linkPc: "#{결제링크}" }
    ]
  },

  /* 녹화본 결제가 확인되면 바로 나갑니다.
     서비스 제공 기간이 7일이라 마감일과 다운로드 안내를 반드시 담습니다.
     기간이 지나면 시청 페이지가 닫히므로, 그 전에 받아 두셔야 한다는 걸
     알려 드리지 않으면 문의가 몰립니다. */
  vod_access: {
    name: "크래빗아카데미_시청안내",
    content: [
      "안녕하세요, 원장님! 크래빗팀입니다 🎬",
      "",
      "#{강의명} 결제가 확인되었어요.",
      "아래 버튼에서 바로 시청하실 수 있습니다.",
      "",
      "■ 시청 비밀번호  #{비밀번호}",
      "■ 시청 기간  #{시청마감일}까지",
      "",
      "기간 안에 영상을 내려받아 두시면",
      "그 뒤로도 편하실 때 천천히 보실 수 있어요.",
      "마감일이 지나면 시청 페이지는 닫힙니다.",
      "",
      "강의자료도 같은 페이지에 함께 담아 두었어요.",
      "링크와 비밀번호는 외부에 공유하지 말아 주세요.",
      "",
      "잘 받으셨는지 궁금한 점 있으시면 연락 주세요.",
      "#{문의처}"
    ].join("\n"),
    buttons: [
      { buttonName: "시청하러 가기", buttonType: "WL", linkMo: "#{시청링크}", linkPc: "#{시청링크}" }
    ]
  },

  /* 진행 방식이 오프라인이든 온라인이든 이 템플릿 하나로 씁니다.
     카카오 알림톡 템플릿은 조건 분기를 못 하므로, 달라지는 부분은
     #{진행방식} 과 #{참여안내} 두 변수에 담아 보냅니다.

       오프라인 → 진행방식 "오프라인" / 참여안내 "광명 GIDC C동 1715호"
       온라인   → 진행방식 "온라인 (줌)" / 참여안내 "https://zoom.us/j/..."
       동시     → 진행방식 "오프라인 + 온라인 동시" / 참여안내 주소와 링크 함께

     #{주최} 는 강의를 여는 곳입니다. 올커니처럼 함께 여는 강의가 많아
     누가 여는 자리인지 밝히는 편이 원장님께 자연스럽습니다.
     템플릿을 세 개로 나누면 심사도 세 번 받아야 해서 이렇게 묶었습니다. */
  reminder: {
    name: "크래빗아카데미_수강리마인드",
    content: [
      "안녕하세요, 원장님! 크래빗팀입니다 ☀️",
      "",
      "내일 #{주최}에서 주최하는",
      "#{강의명}에서 뵙겠습니다.",
      "",
      "■ 일시  #{일시}",
      "■ 진행 방식  #{진행방식}",
      "■ 참여 안내  #{참여안내}",
      "■ 준비물  #{준비물}",
      "",
      "오시는 길이나 접속이 헷갈리시면 편하게 연락 주세요.",
      "내일 뵙겠습니다.",
      "",
      "#{문의처}"
    ].join("\n")
  },

  followup: {
    name: "크래빗아카데미_자료안내",
    content: [
      "안녕하세요, 원장님! 크래빗팀입니다 🎁",
      "",
      "#{강의명} 함께해 주셔서 감사했어요.",
      "약속드린 자료를 보내드립니다.",
      "",
      "■ 확인 기한  #{보관기한}",
      "",
      "아래 버튼에서 받아보실 수 있어요.",
      "학원에 적용하시다가 막히는 부분이 있으면",
      "언제든 편하게 여쭤봐 주세요.",
      "",
      "#{문의처}"
    ].join("\n"),
    buttons: [
      { buttonName: "자료 받기", buttonType: "WL", linkMo: "#{자료링크}", linkPc: "#{자료링크}" }
    ]
  }
};

/* ---------------------------------------------------------------
   명령
   --------------------------------------------------------------- */
const [, , cmd, ...args] = process.argv;

const show = v => console.log(JSON.stringify(v, null, 2));

try {
  switch (cmd) {
    case "channels": {
      const d = await call("GET", "/kakao/v2/channels");
      const list = d.channelList || d.list || d;
      if (!Array.isArray(list) || !list.length) {
        console.log("연동된 카카오 채널이 없습니다.");
        console.log("솔라피 콘솔 > 카카오 > 채널 관리 에서 먼저 연동해 주세요.");
        break;
      }
      console.log("연동된 채널\n");
      for (const c of list) {
        console.log(`  pfId       : ${c.channelId || c.pfId}`);
        console.log(`  검색용 아이디: ${c.searchId || "-"}`);
        console.log(`  상태       : ${c.status || "-"}`);
        console.log("");
      }
      console.log("위 pfId 를 create 명령에 넣으세요.");
      break;
    }

    case "categories": {
      const d = await call("GET", "/kakao/v2/templates/categories");
      const list = d.categoryList || d.list || d;
      console.log("카테고리 코드 (교육 관련만 추려 보세요)\n");
      show(list);
      break;
    }

    case "drafts": {
      console.log("등록할 문안 미리보기\n");
      for (const [key, t] of Object.entries(DRAFTS)) {
        console.log("─".repeat(56));
        console.log(`[${key}] ${t.name}`);
        console.log("─".repeat(56));
        console.log(t.content);
        if (t.buttons) console.log("\n버튼: " + t.buttons.map(b => b.buttonName).join(", "));
        console.log("");
      }
      break;
    }

    case "create": {
      const [key, pfId, categoryCode] = args;
      const draft = DRAFTS[key];
      if (!draft || !pfId || !categoryCode) {
        console.error("사용법: create <키> <pfId> <카테고리코드>");
        console.error("키: " + Object.keys(DRAFTS).join(", "));
        process.exit(1);
      }
      const body = {
        pfId,
        name: draft.name,
        content: draft.content,
        categoryCode,
        messageType: "BA",          /* 기본형 */
        emphasizeType: "NONE"
      };
      if (draft.buttons) body.buttons = draft.buttons;

      const d = await call("POST", "/kakao/v2/templates", body);
      console.log("템플릿을 등록했습니다. 아직 검수 전입니다.\n");
      console.log("  templateId : " + (d.templateId || d.id));
      console.log("  상태       : " + (d.status || "-"));
      console.log("\n다음: node admin/solapi-template.mjs inspect " + (d.templateId || d.id));
      break;
    }

    case "inspect": {
      const [templateId] = args;
      if (!templateId) { console.error("사용법: inspect <템플릿ID>"); process.exit(1); }
      /* POST 가 아니라 PUT 입니다. SDK 에는 이 호출이 빠져 있습니다. */
      const d = await call("PUT", `/kakao/v2/templates/${encodeURIComponent(templateId)}/inspection`);
      console.log("검수를 요청했습니다. 카카오 심사는 영업일 1~3일 걸립니다.\n");
      console.log("  상태: " + (d.status || "-"));
      console.log("\n상태 확인: node admin/solapi-template.mjs status " + templateId);
      break;
    }

    case "status": {
      const [templateId] = args;
      if (!templateId) { console.error("사용법: status <템플릿ID>"); process.exit(1); }
      const d = await call("GET", `/kakao/v2/templates/${encodeURIComponent(templateId)}`);
      console.log("  이름   : " + (d.name || "-"));
      console.log("  상태   : " + (d.status || "-"));
      if (d.comments && d.comments.length) {
        console.log("\n심사 의견");
        for (const c of d.comments) console.log("  - " + (c.content || JSON.stringify(c)));
      }
      break;
    }

    case "list": {
      const d = await call("GET", "/kakao/v2/templates");
      const list = d.templateList || d.list || d;
      const rows = Array.isArray(list) ? list : Object.values(list || {});
      if (!rows.length) { console.log("등록된 템플릿이 없습니다."); break; }
      for (const t of rows) {
        console.log(`  ${t.status || "-"}  ${t.templateId || t.id}  ${t.name || ""}`);
      }
      break;
    }

    default:
      console.log("명령: channels | categories | drafts | create | inspect | status | list");
      console.log("자세한 사용법은 이 파일 맨 위 주석을 보세요.");
  }
} catch (e) {
  console.error("\n실패했습니다.\n");
  console.error(e.message);
  process.exit(1);
}
