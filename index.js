let videoURLs = [];
let input

document.getElementById("set").addEventListener("click", function () {
    // set the input value to the video url array
    input = document.getElementById("urlInput").value;
    // check if the input is a valid url
    if (checkWebsite(input) == false) {
        document.getElementById("status").innerHTML = "Invalid URL";
        return;
    }
    // if the input is already in the array, don't add it again
    if (videoURLs.includes(input)) {
        document.getElementById("status").innerHTML = "URL already added";
        return;
    }
    videoURLs.push(input);
    // clear the input field
    document.getElementById("urlInput").value = "";
    // show the video urls split by a line break
    document.getElementById("videos").innerHTML = videoURLs.join("<br>");
    document.getElementById("status").innerHTML = ""; 
});

// reddit download button
document.getElementById("download").addEventListener("click", function () {
    // for each video url in the array
    videoURLs.forEach((url) => {
        detectSite(url);
    });
});

const getReddit = async (link) => {
  try {
    const response = await fetch(`${link}.json`);
    const data = await response.json();
    const audio_url =
      data[0]?.data?.children[0]?.data?.secure_media?.reddit_video
        ?.fallback_url;
    const normal_url = audio_url?.replace("?source=fallback", "");
    const audio_url_processed = audio_url
      ?.replace(/DASH_[0-9]+/gm, "DASH_AUDIO_128")
      ?.replace("?source=fallback", "");
    return [normal_url, audio_url_processed];
  } catch (error) {
    throw new Error("Error occurred while downloading the Reddit video.");
  }
};

/* Process and download the video */
const processReddit = async (url) => {
  try {
    const url_link = url;
    if (!url_link) return;

    const [videoUrl, audioUrl] = await getReddit(url_link);
    if (!videoUrl || !audioUrl) {
      alert("Video or audio URL not found.");
      return;
    }

    const videoResponse = await fetch(videoUrl);
    const videoBlob = await videoResponse.blob();

    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    const combinedBlob = new Blob(
      [await videoBlob.arrayBuffer(), await audioBlob.arrayBuffer()],
      { type: "video/mp4" }
    );

    // Create a temporary anchor element to trigger the download
    const a = document.createElement("a");
    a.href = URL.createObjectURL(combinedBlob);
    // Set the name of the reddit url file to be downloaded
    const parts = url.split("/");
    if (parts.length >= 2) {
      const secondLastPart = parts[parts.length - 2];
      a.download = secondLastPart + ".mp4";
    } else {
      console.log("No second-to-last slash found in the URL.");
      a.download = "reddit_video.mp4";
    }
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error(error);
    alert("An error occurred while processing the video.");
  }
};

const processTwitter = async (url) => {
    const response = await fetch(url);
    const data = await response.text();
    const video_url = data.match(/<meta property="og:video" content="(.*?)">/)[1];

    const videoResponse = await fetch(video_url);
    const videoBlob = await videoResponse.blob();

    const a = document.createElement("a");
    a.href = URL.createObjectURL(videoBlob);
    a.download = "twitter_video.mp4";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

const detectSite = (url) => {
    if (url.includes("reddit")) {
        processReddit(url);
    }
    if (url.includes("twitter")) {
        processTwitter(url);
    }
    return "unknown";
};

const checkWebsite = (url) => {
    if (url.includes("reddit")) {
        return "reddit";
    }
    if (url.includes("twitter") || url.includes("x")) {
        return "twitter";
    }
    return false
}