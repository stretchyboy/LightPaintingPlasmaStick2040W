const form = document.querySelector("#frameselect");
const frame = document.querySelector("#frame");
const submit = document.querySelector("#submit");
const feedback = document.querySelector("#feedback");
const sightingdots = document.querySelector("#sightingdots");
const body = document.querySelector("body");
const content = document.querySelector("#content");
var loaded = ""
var bConnected = false

const increment = document.querySelector("#increment");
const decrement = document.querySelector("#decrement");


function addFeedback(text){
  feedback.innerHTML = text+"\n"+feedback.innerHTML 
}

async function sendData() {
  // Associate the FormData object with the form element
  const formData = new FormData(form);
  console.log("formData", formData)
  if (loaded == ""){
    addFeedback("Loading")
    try {
        const response = await fetch("/load/"+formData.get("cat")+"/anim/"+formData.get("anim")+"/"+formData.get("frame"), {
        method: "GET",
        cache:"no-store",
        // Set the FormData instance as the request body
        /*headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
          
        },*/
        });
        
        const stickframe = await response.text();
        console.log("stickframe", stickframe)
        addFeedback("Loaded")//\nImage is "+stickframe.widthCM+"cm wide")
        submit.setAttribute("value", "Show")
        loaded = formData.get("frame")
    } catch (e) { 
        unload("Load Failed")
    }
  } else { 
    if(sightingdots.checked){
      addFeedback("Sighting Dots still on")
        
      } else {
    
      addFeedback("Showing")
      await sendShutter()
      
      content.style.display = "none" 
      try {

          const esc = encodeURIComponent;
          const params = { 
            hidewhite: formData.get("hidewhite"),
            paintblack: formData.get("paintblack"),
            paintblackas: formData.get("paintblackas"),
            speckles: formData.get("speckles"),
            lines: formData.get("lines")
          };
          console.log("params", params)
          // this line takes the params object and builds the query string
          const query = Object.keys(params).map(k => `${esc(k)}=${esc(params[k])}`).join('&')
        

          const response = await fetch("/show/"+formData.get("cat")+"/anim/"+formData.get("anim")+"/"+formData.get("frame")+"/"+formData.get("duration")+"?"+query, {
          method: "GET",
          cache:"no-store",
          // Set the FormData instance as the request body
          });
          const showdata = await response.text();
          console.log("showdata", showdata)
          if(response.status == 200)
          {
            addFeedback("Shown")
          }
          else
          {
            addFeedback("Not Shown")
          }
          await sendShutter("release")
          content.style.display = "block" 
          //setTimeout(getJpeg, 5000)
      } catch (e) {
          await sendShutter("release")
          addFeedback("Show Failed")
          console.error(e);
      }
    }
  }
}

function unload(msg=""){
    addFeedback(msg)
    loaded = ""
    submit.setAttribute("value", "Load")
    content.style.display = "block" 
}

async function sendConnect() {
  // Associate the FormData object with the form element
  try {
        const response = await fetch(CAMERAURL, {
        method: "GET",
        mode:    "no-cors",
        cache:"no-store",
        // Set the FormData instance as the request body
        });
        addFeedback("Camera Connected")
        bConnected = true
    } catch (e) {
        bConnected = false
        addFeedback("Camera Connect failed")
        console.error(e);
    }
}

async function sendSightingDots(on) {
  // Associate the FormData object with the form element
  //console.log("sendSightingDots", on)
  sendLiveview()
  try {
        const response = await fetch("/sightingdots/"+on, {
        cache:"no-store",
         method: "GET",
        // Set the FormData instance as the request body
        });
        status = "off"
        if(on){
            status = "on"
            //sendAF()
            sendLiveview()
        } else {
          //sendAF("stop")
          clearInterval(liveviewInterval)
          document.getElementById('liveview').style.display = "none"
        }
        addFeedback("Sighting Dots "+status)

    } catch (e) {
        addFeedback("Sighting Dots changed failed")
        console.error(e);
    }
}

async function sendToCamera(name,path, data) { // ["full_press", "half_press", "release"]:
  if (bConnected == false){
    return
  }
  // Associate the FormData object with the form element
  try {
    addFeedback(name)
    const response = await fetch(CAMERAURL+path, {
      mode:    "no-cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), 
    });
    addFeedback(name+" Done")
  } catch (e) {
      addFeedback(name+" Failed")
      console.error(e);
  }
}

async function sendShutter(action="full_press") { // ["full_press", "half_press", "release"]:
  var name = "Shutter Full Press"
  if(action=="release"){
    name = "Shutter Release"
  }
  const data = {"af": false, "action": action}
  return await sendToCamera(name, "/ver100/shooting/control/shutterbutton/manual", data)
}

var liveviewInterval = 0 
async function sendLiveview(){
  const data = {"liveviewsize": "small", "cameradisplay":"on" }
  if (bConnected ){
    document.getElementById('liveview').style.display = "block"
    liveviewInterval = setInterval(function() {
        var myImageElement = document.getElementById('liveview');
        myImageElement.src = CAMERAURL+'/ver100/shooting/liveview/flip?rand=' + Math.random();
    }, 2000);
    return await sendToCamera("Live View", "/ver100/shooting/liveview", data)
  }
}

//Doesn't seem to help
async function sendAF(action="start") { // ["full_press", "half_press", "release"]:
  var name = "Auto Focus Start"
  if(action=="stop"){
    name = "Auto Focus Stop"
  }
  const data = {"action": action}
  return await sendToCamera(name, "/ver100/shooting/control/af", data)
}

// http://192.168.1.2:8080/ccapi/ver100/shooting/control/af {"action": "start"} then {"action": "stop"}

async function sendCameraGet(path) {
  // Associate the FormData object with the form element
  const response = await fetch(CAMERAURL+path, {
    method: "GET",
    mode:   "no-cors",
    cache:  "no-store",
  });
  //addFeedback(name+" Done")
  try{
  const data  = await response.json()
  console.log("sendCameraGet", path, data)
  return data
  } catch (e) {
    console.error(e, response);  
  }
}
/*
async function getJpeg() {
  const options = {
    method: "GET",
    mode:   "no-cors",
    cache:  "no-store",
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer"
  }
  const response = await fetch(CAMERAURL+"/ver110/contents/sd1/100CANON?type=jpeg", options)//"/ver110/devicestatus/currentstorage", options);
  const movies = await response.json();
  console.log("data", movies);
}
*/

// use event pooling instead it will give list of new images http://192.168.0.62:8080/ccapi/ver100/event/polling
async function getJpeg(){
  const options = {
    method: "GET",
    mode:   "no-cors",
    cache:  "no-store",
    //credentials: "same-origin", // include, *same-origin, omit
    credentials: "omit", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer"
  }
  const storageRequest = new Request(CAMERAURL+"/ver110/devicestatus/currentstorage", options);
  fetch(storageRequest)
  .then((response) => console.log)
  
  /*response.json())
  .then((data) => {
    console.log("data", data)
  })
  .catch(console.error)
  //.catch((d) => {console.log("d", dispatchEvent)})
  */
}

/*
  // still image here  http://192.168.0.62:8080/ccapi/ver100/shooting/liveview/flip
async function getJpeg(){
  addFeedback("Getting Image")
  //onion skinning would be pretty easy if we can get the last shot
  const resp1 = await sendCameraGet("/ver110/devicestatus/currentstorage")
  //const resp1J = await resp1.json();
  console.log(resp1J)
  const resp2 = await sendCameraGet("/ver110/contents/sd1")
  console.log(resp2)
  const resp3 = await sendCameraGet("ver110/contents/sd1/100CANON?type=jpeg")
  console.log(resp3)
  return resp3
  

  // http://192.168.0.62:8080/ccapi/ver110/devicestatus/currentstorage
  // http://192.168.0.62:8080/ccapi/ver110/contents/sd1
  // http://192.168.0.62:8080/ccapi/ver110/contents/sd1/100CANON?type=jpeg
}
*/

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOMContentLoaded", event)
  sendConnect();
  sendData();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();  
  console.log("sendData")
  sendData();
});

sightingdots.addEventListener("change", (event) => {
  on = 0
  if (sightingdots.checked == true){
    on = 1
  }
  //console.log("sightingdots", event, on)
  sendSightingDots(on);
});

frame.addEventListener("change", (event) => {
  unload()
})

increment.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("frame", frame)
    unload("Next Frame will need to be loaded")
    frame.stepUp();
})

decrement.addEventListener("click", (event) => {
    event.preventDefault();
    unload("Previous Frame will need to be loaded")
    frame.stepDown();
})
