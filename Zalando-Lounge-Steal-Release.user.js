// ==UserScript==
// @name         Zalando-Lounge-Steal
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       Propsi4
// @include      https://www.zalando-lounge.*/campaigns/*/categories/*/articles/*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @icon         https://img.icons8.com/stickers/2x/sweater.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // elements
        let controlpanel = document.createElement('div')
        let continue_checkbox = document.createElement('input')
        let continue_checkbox_label = document.createElement('label')
        let start_button = document.createElement('button')
        let content = document.createElement('div')
        let title_content = document.createElement('span')
        let listSizes = document.createElement('div')
        let title_controlpanel = document.createElement('div')
        let title = document.createElement('span')

    let working = false
    const audio = new Audio('https://cdn.freesound.org/previews/277/277033_847303-lq.mp3')
    var continue_mode = false
    const url_array = window.location.href.split("/")
    const campaign = url_array[4]
    const article = url_array[8]
    const sizes_api_url = `https://${url_array[2]}/api/phoenix/catalog/events/${campaign}/articles/${article}?globalCats=1`
    const add_to_cart = `https://${url_array[2]}/api/phoenix/stockcart/cart/items`
    const fetch_info_url = `https://${url_array[2]}/api/phoenix/stockcart/articles`
    let xmlHttp = new XMLHttpRequest();
    let search_sizes = []
    const disabled_color = 'rgb(230, 34, 44)'
    const enabled_color = 'rgb(62, 179, 93)'
    const sizes_xpath = '//*[@id="article-size-section"]/div[2]/div[3]'
    const getElementByXpath = (path) => {
            return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }
    const processSelecting = (e) => {
        if(working){
            alert("Reload the page to change sizes")
            return
        }
        let color = e.currentTarget.style.background
        if(color == disabled_color){
            e.currentTarget.style.background = enabled_color
            search_sizes.push(e.currentTarget.id)
        }
        else{
            e.currentTarget.style.background = disabled_color
            const index = search_sizes.indexOf(e.currentTarget.id);
            search_sizes.splice(index, 1);
        }
    }
    const run = (e) => {
        if(working){
          return
        }
        if(search_sizes.length === 0){
            alert("Choose the size!")
            return
        }

        var catched_sizes = ""
        working = true

        let button = e.currentTarget
        let time=0
        let data = []
        let sizes_data = []
        xmlHttp.open("GET", sizes_api_url, false)
        xmlHttp.send(null)
        var simples = JSON.parse(xmlHttp.responseText).simples
        for(let i = 0; i < simples.length; i++){
            if(search_sizes.includes(simples[i].filterValue)){
                data.push(simples[i].sku)
                sizes_data.push(simples[i].filterValue)
            }
        }
        let timer=setInterval(() => {
            if(!data.length){
                 clearInterval(timer)
                audio.play()
                 alert("Done, catched sizes: " + catched_sizes)
            }
            let body = JSON.stringify({
                "campaignIdentifier": campaign,
                "configSku": article,
                "simpleSkus": data
            })
            try{
                xmlHttp.open("POST", fetch_info_url, false)
                xmlHttp.setRequestHeader("Content-Type","application/json")
                xmlHttp.send(body)
            }catch{
                clearInterval(timer)
                audio.play()
                alert("Stopped. Bad connection(no Internet)")
            }
            let info = JSON.parse(xmlHttp.responseText)
            for(let i = 0; i < info.length; i++){
                let index = data.indexOf(info[i].simpleSku);
                 //console.log(sizes_data[index] + " - " + info[i].stockStatus)
                 if(info[i].stockStatus == "AVAILABLE"){
                   let body = JSON.stringify({
                       "quantity" : 1,
                       "campaignIdentifier": campaign,
                       "configSku": article,
                       "simpleSku": info[i].simpleSku,
                       "additional" : {
                           "reco" : 0
                       }
                   })
                   try{
                    xmlHttp.open("POST", add_to_cart, false)
                    xmlHttp.setRequestHeader("Content-Type","application/json")
                    xmlHttp.send(body)
                   }catch(e){}
                     if(xmlHttp.status === 501){
                        clearInterval(timer)
                        let message = JSON.parse(xmlHttp.responseText).message
                        audio.play()
                        alert("Done, catched sizes: " + catched_sizes +
                             "\nError "+xmlHttp.status+": " + message)
                        break
                    }
                     else if(xmlHttp.status === 409 || xmlHttp.status === 403){
                         console.log("["+xmlHttp.status+"]"+" Trying to catch " + sizes_data[index])
                     }
                    else if(xmlHttp.status === 200){

                        catched_sizes += sizes_data[index] + " "
                        audio.play()
                        if(!continue_mode){
                            data.splice(index, 1);
                        }
                            title.textContent = "Catched: " + catched_sizes
                    }
                 }
            }
            time++
            button.innerHTML = `Working... (${time}s)\nTo stop - reload the page`
        },1000)

        
    }

    window.addEventListener('load', function() {

        let position = getElementByXpath('//*[@id="article-size-title"]')

        // CSS START
        position.appendChild(controlpanel)
        controlpanel.appendChild(title_controlpanel)
        controlpanel.appendChild(content)
        title_controlpanel.appendChild(title)
        content.appendChild(title_content)
        content.appendChild(listSizes)
        content.appendChild(continue_checkbox)
        content.appendChild(continue_checkbox_label)
        content.appendChild(start_button)



        continue_checkbox.setAttribute("type","checkbox")
        continue_checkbox.setAttribute("id","keep")
        continue_checkbox.addEventListener('change',() =>{continue_mode = !continue_mode})
        continue_checkbox_label.setAttribute("for","keep")
        continue_checkbox_label.innerHTML = "Keep claiming when the size is claimed"
        continue_checkbox_label.style.fontWeight = "bold"

        start_button.innerHTML = "Start"
        start_button.onclick = run

        controlpanel.setAttribute("id", "controlpanel")
        controlpanel.style.minHeight = '150px'
        controlpanel.style.backgroundColor = '#eeeee4'
        controlpanel.style.borderRadius = '10px'
        controlpanel.style.overflow = 'hidden'

        title_controlpanel.style.display = 'flex'
        title_controlpanel.style.justifyContent = 'center'
        title_controlpanel.style.alignItems = 'center'
        title_controlpanel.style.padding = '3px'
        title_controlpanel.style.backgroundColor = '#4d4c4a'

        title.textContent = "Stealer by Propsi4"
        title.style.fontFamily = "'Roboto', sans-serif"
        title.style.fontSize = "14pt"
        title.style.fontWeight = "bold"
        title.style.color = "#eb4034"

        content.style.display = 'flex'
        content.style.height = '100%'
        content.style.alignItems = 'center'
        content.style.justifyContent = 'center'
        content.style.margin = '10px'


        listSizes.style.display = 'flex'
        listSizes.style.flexWrap = 'wrap'
        listSizes.style.minWidth = '150px'
        // CSS END

        title_content.innerHTML = "Sizes available:"
        title_content.style.fontWeight = "bold"
        xmlHttp.open("GET", sizes_api_url, false)
        xmlHttp.send(null)
        let simples = JSON.parse(xmlHttp.responseText).simples
        for(let i = 0; i < simples.length; i++){
            if(simples[i].stockStatus !== "SOLD_OUT"){
                let div = document.createElement('div')
                div.style.minWidth = '27px'
                div.style.textAlign = 'center'
                div.style.margin = '3px'
                div.style.padding = '3px'
                div.style.border = '2px solid black'
                div.style.fontColor = 'white'
                div.style.fontWeight = 'bold'
                div.style.borderRadius = '2px'
                div.style.background = disabled_color
                div.setAttribute("id",`${simples[i].filterValue}`)
                div.addEventListener("click", processSelecting, false)
                div.innerHTML = simples[i].filterValue
                listSizes.appendChild(div)
            }
      }
    }, false);
    })();