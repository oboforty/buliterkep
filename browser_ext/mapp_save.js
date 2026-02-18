// ==UserScript==
// @name         MAPP Save Event
// @namespace    http://tampermonkey.net/
// @version      2026-02-12
// @description  zsia dzsidzsa zsegzs?
// @author       hackerman
// @run-at       document-end
// @match        https://www.facebook.com/events/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=facebook.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const lambda_url = "https://maspzs2hxysw675ccmgdcbwrb40ralld.lambda-url.eu-central-1.on.aws/"


function find_details() {
  const h2 = Array.from(document.querySelectorAll('h2'))
  if (h2.length == 0) return errorgec("H2 not found: ", h2)

  const h2_details = h2.filter(h2e=>h2e.textContent.toLowerCase().includes("details"));
  if (h2_details.length != 1) return errorgec("H2>details not found: ", h2_details)

  // 4 elemmel fentebb van a Details page a h2-hoz kepest
  return find_nth_parent(h2_details[0], 4);
}

const ignored_h1 = ["chat", "events", "notifications"]
function _filter_event_h1(h1e) {
    const title = h1e.textContent.toLowerCase()
    for (let rule of ignored_h1) {
        if (title.includes(rule)) {
            return false;
        }
    }
    return true;
}

function find_header() {
    const h1 = Array.from(document.querySelectorAll('h1'));
    if (h1.length == 0) return errorgec("H1 not found: ", h1)
    const h1_title = h1.filter(_filter_event_h1);
    if (h1_title.length != 1) return errorgec("H1>title not found: ", h1_title)

    return find_nth_parent(h1_title[0], 2);
}


function find_nth_parent(element, n) {
  let current = element;

  for (let i = 0; i < n; i++) {
    if (!current) return null
    else if (!current.parentElement) {
        console.error("@@@@@ MIERT HALSZ MEG????", current, current.parentElement, current.parentNode)
        return current;
    }

    //console.log("@@ bindes geci", i, current)
    current = current.parentElement;
  }

  return current;
}

function htext(elem, prefix_strip) {
    return elem.textContent.replace(prefix_strip, "").trim()
}

function get_event_details() {
    const header = Array.from(find_header().children)
    const details = Array.from(find_details().children)

    let data = {
        time: htext(header[0]),
        title: htext(header[1]),
        loc1: htext(header[2]),

        event_by: htext(details[2], "Event by"),
        loc2: htext(details[3]),
        tix_url: htext(details[4], "Tickets"),

        about1: htext(details[details.length-2]),
        about2: htext(details[details.length-1]),
    }

    return data;
}

function errorgec(err, ctx) {
    alert("MAPP ERROR: " + err);
    console.error("@@ [MAPP] ERROR:", err, ctx)

    return null;
}

//setTimeout(()=>{
//}, 1000)

const interested_btn = document.querySelector('[aria-label="Interested"]');

if (interested_btn) {
    console.log("@@ [MAPP] activated!");
} else {
    console.error("@@ [MAPP] nem talalom!!!!!");
}

interested_btn.addEventListener('click', function (e) {
    const event = get_event_details();
    console.log("@@ [MAPP] PUSH EVENT:", event);

    GM_xmlhttpRequest({
        url: lambda_url,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        data: JSON.stringify(event),
        onload: function(response) {
            console.log(response.responseText);
        }
    });
});
