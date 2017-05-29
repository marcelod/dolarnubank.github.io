(function(window, document) {
'use strict';

var $usd = document.getElementById('usd');
var $brl = document.getElementById('brl');
var $ptax = document.getElementById('ptax');
var $iof = document.getElementById('iof');
var $spread = document.getElementById('spread');

var defaultIof = 6.38;
var defaultSpread = 4.073; // [carece de fontes]

var jsonpCallback = 'onReceiveData';

window[jsonpCallback] = function(response) {
    try {
        $ptax.value = numToStr(response.query.results.json.conteudo[0].
            valorVenda);

        $iof.value = numToStr(defaultIof);
        $spread.value = numToStr(defaultSpread);
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

function strToNum(str) {
    return +str.replace(',', '.');
}

function numToStr(num) {
    return ('' + num).replace('.', ',');
}

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
    return strToNum($iof.value) / 100;
}

function getSpread() {
    return strToNum($spread.value) / 100;
}

function getDollar() {
    return strToNum($ptax.value) * (1 + getSpread());
}

function usdToBrl() {
    // Valor da compra em dólar
    var usd = strToNum($usd.value);

    // Multiplica pelo valor do dólar ptax com spread
    var value = usd * getDollar();

    // Adiciona o IOF
    value += getIof() * value;

    if (isNaN(value)) {
        return;
    }

    $brl.value = round(value);
    window.location = '#dolar=' + usd;
}

function brlToUsd() {
    // Valor da compra em reais
    var brl = strToNum($brl.value);

    // Descobre o valor em dólar sem o IOF
    // USD + USD*IOF = BRL
    // USD*(1 + IOF) = BRL
    // USD = BRL/(1 + IOF)
    var value = brl / (1 + getIof());

    // Divide pelo valor de 1 dólar com spread
    value /= getDollar();

    if (isNaN(value)) {
        return;
    }

    $usd.value = round(value);
    window.location = '#real=' + brl;
}

function round(value) {
    // Arredondar valor final (https://stackoverflow.com/a/18358056)
    value = +(Math.round(value + "e+2")  + "e-2");

    // Garantir que vai usar duas casas decimais
    value = numToStr(value.toFixed(2));

    return value;
}

function zero(n) {
    return n < 10 ? '0' + n : n;
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
onInput($ptax, usdToBrl);


// Pegar dados do Banco Central usando a api do Yahoo YQL
var d = new Date();
var nocache = '' + d.getFullYear()
    + zero(d.getMonth() + 1)
    + zero(d.getDate())
    + zero(d.getHours());

var query = 'select * from json where url="';
query += 'https://www.bcb.gov.br/api/conteudo/pt-br/PAINEL_INDICADORES/cambio?';
query += nocache + '"';

query = encodeURIComponent(query);

var script = document.createElement('script');

var param = 'q=' + query + '&format=json&callback=' + jsonpCallback;

script.src = 'https://query.yahooapis.com/v1/public/yql?' + param;
script.async = 'async';
document.body.appendChild(script);

})(window, document);
