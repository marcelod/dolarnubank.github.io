(function(window, document) {
'use strict';

var $usd = document.getElementById('usd');
var $brl = document.getElementById('brl');
var $iof = document.getElementById('iof');
var $spread = document.getElementById('spread');

var dolarPtax;

var jsonpCallback = 'onReceiveData';

window[jsonpCallback] = function(response) {
    try {
        dolarPtax = +response.query.results.json.conteudo[0].valorVenda;
    }
    catch(e) {
        $usd.value = 'Erro';
        $brl.value = 'Erro';
        return;
    }

    $usd.removeAttribute('disabled');
    $brl.removeAttribute('disabled');

    var hash = location.hash.slice(1);
    if (hash) {
        var query = queryStringParse(hash);
        if (query.dolar) {
            $usd.value = query.dolar;
            usdToBrl();
            $usd.focus();
        }
        else if (query.real) {
            $brl.value = query.real;
            brlToUsd();
            $brl.focus();
        }
    }
    else {
        $usd.value = '1,00';
        usdToBrl();
        $usd.focus();
    }

};

function queryStringParse(q) {
    var vars = q.split('&'),
        result = {},
        part,
        key, value;

    for (var i = 0, len = vars.length; i < len; i++) {
        part = vars[i].split('=');

        key = (part[0] && decodeURIComponent(part[0])) || '';
        value = (part[1] && decodeURIComponent(part[1])) || '';

        if (key) {
            result[key] = value;
        }
    }

    return result;
}

function getIof() {
    var iof = +($iof.value.replace(',', '.'));

    return iof / 100;
}

function getSpread() {
    var spread = +($spread.value.replace(',', '.'));

    return spread / 100;
}

function getDolar() {
    return dolarPtax * (1 + getSpread());
}

function usdToBrl() {
    var usd = +$usd.value.replace(',', '.');

    var valor = usd * getDolar();

    valor += getIof() * valor;

    if (isNaN(valor)) {
        return;
    }

    $brl.value = arredondar(valor);
    window.location = '#dolar=' + usd;
}

function brlToUsd() {
    var brl = +$brl.value.replace(',', '.');

    var valor = brl / (1 + getIof());

    valor /= getDolar();

    if (isNaN(valor)) {
        return;
    }

    $usd.value = arredondar(valor);
    window.location = '#real=' + brl;
}

function arredondar(valor) {
    // Arredondar valor final (https://stackoverflow.com/a/18358056)
    valor = +(Math.round(valor + "e+2")  + "e-2");

    // Duas casas decimais e substituir ponto por vírgula
    valor = (valor).toFixed(2).replace('.', ',');

    return valor;
}

function onInput(obj, callback) {
    obj.addEventListener('input', function() {
        callback();
    });
}

onInput($usd, usdToBrl);
onInput($brl, brlToUsd);
onInput($iof, usdToBrl);
onInput($spread, usdToBrl);



var d = new Date();
var nocache = '' + d.getFullYear() + (d.getMonth() + 1) + d.getDate() + d.getHours();

var query = 'select * from json where url="https://www.bcb.gov.br/api/conteudo/pt-br/PAINEL_INDICADORES/cambio?' + nocache + '"';
query = encodeURIComponent(query);

var script = document.createElement('script');

var param = 'q=' + query + '&format=json&callback=' + jsonpCallback;

script.src = 'https://query.yahooapis.com/v1/public/yql?' + param;
document.body.appendChild(script);

})(window, document);
