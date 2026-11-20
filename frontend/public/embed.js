/**
 * Vote Social — Contact Your Representative Embed Loader (`https://vote-social.ca/embed.js`)
 *
 * Automatically resizes Vote Social `/embed/contact-rep/` iframes when the user
 * progresses through the 3-step carousel, and preserves host-DOM SEO attribution links.
 */
(function () {
  if (typeof window === "undefined") return;
  if (window.__voteSocialEmbedInitialized) return;
  window.__voteSocialEmbedInitialized = true;

  var ORIGIN = "https://vote-social.ca";

  function findMatchingIframes(sourceWindow) {
    var iframes = document.querySelectorAll(
      'iframe[src*="/embed/contact-rep"], .vote-social-embed iframe'
    );
    var matched = [];
    for (var i = 0; i < iframes.length; i++) {
      var frame = iframes[i];
      if (!sourceWindow || frame.contentWindow === sourceWindow) {
        matched.push(frame);
      }
    }
    return matched;
  }

  window.addEventListener("message", function (event) {
    if (!event || !event.data || event.data.type !== "vote-social:resize") {
      return;
    }
    var height = Number(event.data.height);
    if (!height || height < 240 || height > 2400) return;

    var frames = findMatchingIframes(event.source);
    for (var i = 0; i < frames.length; i++) {
      frames[i].style.height = Math.ceil(height) + "px";
    }
  });

  function initContainers() {
    var containers = document.querySelectorAll(".vote-social-embed");
    for (var i = 0; i < containers.length; i++) {
      var el = containers[i];
      if (el.getAttribute("data-vs-mounted") === "1") continue;
      el.setAttribute("data-vs-mounted", "1");

      var existingIframe = el.querySelector("iframe");
      if (!existingIframe) {
        var params = new URLSearchParams();
        var tier = el.getAttribute("data-tier");
        var subject = el.getAttribute("data-subject");
        var body = el.getAttribute("data-body");
        var postcode = el.getAttribute("data-postcode");
        if (tier) params.set("tier", tier);
        if (subject) params.set("subject", subject);
        if (body) params.set("body", body);
        if (postcode) params.set("postcode", postcode);
        params.set("host_footer", "1");

        var iframe = document.createElement("iframe");
        iframe.src =
          ORIGIN + "/embed/contact-rep/?" + params.toString();
        iframe.title =
          "Contact Your Elected Representative — Vote Social";
        iframe.loading = "lazy";
        iframe.style.width = "100%";
        iframe.style.border = "0";
        iframe.style.overflow = "hidden";
        iframe.style.minHeight = "440px";
        iframe.style.transition = "height 0.25s ease";
        el.insertBefore(iframe, el.firstChild);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContainers);
  } else {
    initContainers();
  }
})();
