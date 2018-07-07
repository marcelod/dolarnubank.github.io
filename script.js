(function(window, document) {
'use strict';

var $usd = document.getElementById('usd');
var $brl = document.getElementById('brl');
var $ptax = document.getElementById('ptax');
var $iof = document.getElementById('iof');
var $spread = document.getElementById('spread');
var $showSteps = document.getElementById('show-steps');
var $stepToStep = document.getElementById('step-to-step');

var defaultIof = 6.38;
var defaultSpread = 4;

var jsonpCallback = 'onReceiveData';

window[jsonpCallback] = function(response) {
    try {
        $ptax.value = numToStr(response.query.results.json.conteudo[0].
            valorVenda);
    }
    catch(e) {
        $usd.value = 'Erro';
        $brl.value = 'Erro';
        return;
    }

    $iof.value = numToStr(defaultIof);
    $spread.value = numToStr(defaultSpread);

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

    // Arredondar valor
    value = round(value);

    if (isNaN(value)) {
        return;
    }

    $brl.value = numToStr(value);

    if ($stepToStep.childElementCount) {
        stepToStepUsdToBrl();
    }

    location.replace('#dolar=' + $usd.value);
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

    // Arredondar valor
    value = round(value);

    if (isNaN(value)) {
        return;
    }

    $usd.value = numToStr(value);

    if ($stepToStep.childElementCount) {
        stepToStepUsdToBrl();
    }

    location.replace('#real=' + $brl.value);
}

function stepToStepUsdToBrl() {
    // Para uma maior precisão de cálculos, vamos usar a biblioteca big.js

    var decimalPlaces = 5;

    var floatPtax = strToNum($ptax.value); // Valor decimal (float)
    var strPtax = numToStr(floatPtax);     // Texto com vírgula
    var bigPtax = Big(floatPtax);          // Valor preciso

    var floatUsd = strToNum($usd.value);
    var strUsd = numToStr(floatUsd);
    var bigUsd = Big(floatUsd);

    var floatSpread = strToNum($spread.value);
    var bigSpread = Big(floatSpread);

    var floatIof = strToNum($iof.value);
    var bigIof = Big(floatIof);

    var bigCalc;
    var strCalc;

    var html = '';

    html += '// Anote o valor do dólar PTAX (venda) no site do BC<br>';
    html += '= ' + strPtax + '<br><br>';

    bigCalc = bigPtax.times(bigUsd).round(decimalPlaces);
    strCalc = numToStr(bigCalc);

    html += '// Multiplique pelo valor da sua compra<br>';
    html += '= ' + strPtax + ' × ' + strUsd + '<br>';
    html += '= ' + strCalc + '<br><br>';

    var bigSpreadDiv100 = bigSpread.div(100).round(decimalPlaces);
    var bigCalcTimesSpread = bigCalc.times(bigSpreadDiv100).round(decimalPlaces);

    html += '// Adicione o spread<br>';
    html += '= ' + strCalc + ' + (' + strCalc + ' × ';
    html += numToStr(bigSpreadDiv100) + ')<br>';
    html += '= ' + strCalc + ' + ' + numToStr(bigCalcTimesSpread) + '<br>';

    bigCalc = bigCalc.plus(bigCalcTimesSpread).round(decimalPlaces);
    strCalc = numToStr(bigCalc);

    html += '= ' + strCalc + '<br><br>';

    var bigIofDiv100 = bigIof.div(100).round(decimalPlaces);
    var bigCalcTimesIof = bigCalc.times(bigIofDiv100).round(decimalPlaces);

    html += '// Adicione o IOF<br>';
    html += '= ' + strCalc + ' + (' + strCalc + ' × ';
    html += numToStr(bigIofDiv100) + ')<br>';
    html += '= ' + strCalc + ' + ' + numToStr(bigCalcTimesIof) + '<br>';

    bigCalc = bigCalc.plus(bigCalcTimesIof).round(decimalPlaces);
    strCalc = numToStr(bigCalc);

    html += '= ' + strCalc + '<br><br>';

    html += '// Valor total na sua fatura, arredondado<br>';
    html += '= ' + numToStr(round(bigCalc));

    $stepToStep.innerHTML = html;
}

function round(value) {
    // Arredondar valor final (https://stackoverflow.com/a/18358056)
    value = +(Math.round(value + "e+2")  + "e-2");

    // Garantir que vai usar duas casas decimais
    value = value.toFixed(2);

    return value;
}

function zero(n) {
    return n < 10 ? '0' + n : n;
}

function include(url, callback) {
    var elem = document.createElement('script');
    elem.type = 'text/javascript';
    elem.async = 'async';
    elem.src = url;

    if (elem.readyState) {
        elem.onreadystatechange = function () {
            if (elem.readyState === 'loaded' ||
                elem.readyState === 'complete') {
                elem.onreadystatechange = null;
                callback && callback();
            }
        };
    }
    else {
        elem.onload = function() {
            elem.onload = null;
            callback && callback();
        };
    }

    document.body.appendChild(elem);
}

function onInput(obj, callback) {
    obj.addEventListener('input', function() {
        callback();
    });
}

function onClick(obj, callback) {
    obj.addEventListener('click', function(e) {
        callback(e);
    });
}

onInput($usd, usdToBrl);
onInput($brl, brlToUsd);
onInput($iof, usdToBrl);
onInput($spread, usdToBrl);
onInput($ptax, usdToBrl);

onClick($showSteps, function(e) {
    e.preventDefault();

    if ($usd.disabled) {
        return;
    }

    if ($stepToStep.childElementCount) {
        $stepToStep.innerHTML = '';
        $stepToStep.style.display = 'none';
    }
    else {
        if (window.Big) {
            stepToStepUsdToBrl();
            $stepToStep.style.display = 'block';
        }
        else {
            include('big.min.js', function() {
                stepToStepUsdToBrl();
                $stepToStep.style.display = 'block';
            });
        }
    }
});

// Se a tela for pequena, já adiciona uma barra de rolagem, para que ao
// clicar em "mostrar passo a passo" não faça o layout andar
if (window.innerHeight < 627) {
    document.body.style.overflowY = 'scroll';
}


// Pegar dados do Banco Central usando a api do Yahoo YQL
var d = new Date();
var nocache = '' + d.getFullYear() +
    zero(d.getMonth() + 1) +
    zero(d.getDate()) +
    zero(d.getHours());

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
