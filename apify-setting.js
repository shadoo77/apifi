// Custom ID :   shadi-scrape
// Start URLs :  https://www.immowelt.de/liste/basel-landschaft-kanton/haeuser/kaufen?lat=47.45127896&lon=7.70087979&sort=relevanz
// Pseudo-URLs : HOUSE      https://www.immowelt.de/expose/[.*]
// Pseudo-URLs : PAGE     https://www.immowelt.de/liste/basel-landschaft-kanton/haeuser/kaufen?lat=47.45127896&lon=7.70087979&sort=relevanz&cp=[\d+]
// Clickable elements : .listitem > a, a#nlbPlus

function pageFunction(context) {
    
    function convertor(value, method) {
        var newValue = value.replace(/\r?\n|\r/g, '');
        newValue = newValue.trim();
        newValue = newValue.split(" ")[0];
        newValue = newValue.replace(/\./g, '');
        newValue = newValue.replace(/\,/g, '.');
        newValue = Number(newValue);
        if(method === 'room') {
            newValue = Math.round(newValue);
        }
        return newValue;
    }

    function dataExtract(scriptTxt, objName, method) {        
        scriptTxt = scriptTxt.split(objName)[1];
        scriptTxt = scriptTxt.match(/.*{([^}]*.*?"[^}]*?)}/gm)[0];
        scriptTxt = JSON.parse(scriptTxt);
        if(method === 'img') {
            var imagesArr = [];
            scriptTxt.imageData.forEach(function(el) {
                imagesArr.push(el.srcImageStage);
            });
            return imagesArr;
        }else return scriptTxt;
    }
    
    // called on every page the crawler visits, use it to extract data from it
    var $ = context.jQuery;
    if (context.request.label === "HOUSE") {
        var house = {};
        
        var link = $('.js-endlink-input').attr('value');
            house.link = link;
            house["location"] = {};
            house["location"].country = "Switzerland";
            house["location"].city = "Basel";
            var address = $('div.location').find('span.no_s').text();
            house["location"].address = address;

            //var scriptTxt = $('script:not([src])')[6].children[0].data;
            var scriptTxt = '';
            $('script:not([src])').each( function(i, el) {
                scriptTxt += el.firstChild.data;
            });
           
            var latLon = dataExtract(scriptTxt, 'MapOptions:', 'google');
            house["location"].coordinates = {lat: latLon.pinLat, lon: latLon.pinLon};
            
            // extract main information
            var mainInfo = dataExtract(scriptTxt, 'googleDoubleClickValues:', null);
            
            house["size"] = {};
            //var livingArea = convertor($('div.hardfacts.clear div.hardfact').eq(1).text(), null);
            //var numberOfRooms = convertor($('div.hardfacts.clear div.hardfact').eq(2).text(), 'room');
            var livingArea = convertor(mainInfo.Wohnflaeche, null);
            var numberOfRooms = convertor(mainInfo.ZimmerAnzahl, 'room');
            house["size"] = {gross_m2: livingArea, rooms: numberOfRooms};

            house["price"] = {};
            var price = $('div.hardfacts.clear div.hardfact').eq(0).text();
            price = convertor(price, null);
            price = isNaN(price) ? "On demand" : price;
            house["price"] = {value: price, currency: "CHF"};
            
            
        
            house.images = [];
            var imagesSrc = dataExtract(scriptTxt, 'exposeConfig:', 'img');
            house.images = imagesSrc;


            var description = $('.read.clear .read.clear').find('p').text();
            description = description.replace(/\r?\n|\r/g, '');
            description = description.trim();
            house.description = description;
            house.title = mainInfo.Title;

        return house;
    } else {
        context.skipOutput();
    }
}