

const ELEMENTS = {
    $coinListDiv: $('.coinListDiv'),
    $cardTile: $('.cardTile'),
    $formEl: $('#searchForm'),
    $loaderEl: $(".api-loader"),
    $secondApiLoaderEl: $('.second-api-loader'),
    $liveReportsEl: $('#liveReports'),
    $homePageEl: $('#homeTab'),
    $liveReportsNavTab: $('#liveReportsTab'),
    $aboutTabEl: $('#aboutTab')
};

const STATE = {
    coins: [],
    modalDisplayerCounter: [],
    markedCoinSymbols: [],
    turnedOffCoins: [],
    liveReportTimer: null
};

const INDIVIDUAL_CARD_CLASS_NAME = 'cardTile'

const COIN_LIST_API = 'https://api.coingecko.com/api/v3/coins/list'
const MORE_INFO_API = 'https://api.coingecko.com/api/v3/coins'

function main() {
    appendCoins()

    ELEMENTS.$formEl.on('submit', onSubmitSearch)
    ELEMENTS.$liveReportsNavTab.on('show.bs.tab', onLiveReportsClick)
    ELEMENTS.$homePageEl.on('show.bs.tab', onHomePAgeClick);
    ELEMENTS.$aboutTabEl.on('show.bs.tab', onAboutClick);
}

console.log(ELEMENTS.$formEl)

function onLiveReportsClick(e) {
    if (STATE.modalDisplayerCounter.length === 0) {
        alert('Choose coins to enter Live Reports Tab.');

        e.preventDefault();

        return;
    };
    displayLiveReports();
    hideSearchTab();
};

function onHomePAgeClick() {
    restoreLiveReportTimer();
    showSearchTab();
};

function onAboutClick() {
    restoreLiveReportTimer();
    hideSearchTab();
};


function appendCoins() {
    $.ajax(COIN_LIST_API, {
        method: 'GET',
        beforeSend: () => {
            ELEMENTS.$loaderEl.fadeIn(500);
        },
        success: data => {
            if (100 < data.length) {
                data.splice(100);
                data.forEach(coin => {
                    addCoinsToDiv(coin);
                });
            }
        },
        complete: () => {
            ELEMENTS.$loaderEl.fadeOut(500);
        }
    })
};

function addCoinsToDiv(coin) {
    STATE.coins.push(coin);
    const $coinsEl = createCoinComponent(coin);
    ELEMENTS.$coinListDiv.append($coinsEl)
};


function createCoinComponent(coin) {
    const $output = $(`
            <div class='${INDIVIDUAL_CARD_CLASS_NAME} card col-sm-4'>
                <div class="card-body">
                    <label class="checkBox el-switch">
                        <input class="switch${coin.id} forCloseBtn" type="checkbox" name="switch">
                        <span class="switchSpan el-switch-style"></span>
                    </label>
                    <div class="coinSym">${coin.symbol}</div>
                    <div class="coinName">${coin.name}</div>
                    <button class="infoBtn btn btn-primary btn-sm" data-toggle="collapse" data-target="#collapseCoin${coin.id}" aria-expanded="false" aria-controls="collapseCoin${coin.id}" type="button">More Info</button>
                    <div class='collapse footer' id="collapseCoin${coin.id}">
                    <div class="moreInfo-loader"></div>
                    </div>
                </div>
            </div>                 
`);

    $('.moreInfo-loader').hide()

    const $infoBtn = $output.find('.infoBtn')
    $infoBtn.on('click', (e) => {
        const $ets = $(e.target.nextElementSibling);
        coinInfoApi(coin.id, (moreInfo) => {
            $ets.html(`
                    <div class='card-footer'>
                        <img src='${moreInfo.image.small}'/>
                        <div>$ : ${moreInfo.market_data.current_price.usd}</div>
                        <div>€ : ${moreInfo.market_data.current_price.eur}</div>
                        <div>₪ : ${moreInfo.market_data.current_price.ils}</div>
                    </div>
                `);
        });
    });

    onChangeSwitch($output, coin)

    return $output
};

function Modal($output, coin) {
    displayModalComponent($output, coin)
}

function createModalCoinsComponent(coin) {
    const $modalCoinsEl = $(`
    <div class="cardTile${coin.id} card col-md-12">
    <div class="card-body">
        <label class="checkBox el-switch">
            <input class="switch${coin.id}" type="checkbox" checked name="switch">
                <span class="switchSpan el-switch-style"></span>
        </label>
            <div class="coinSym">${coin.symbol}</div>
            <div class="coinName">${coin.name}</div>
    </div>
    </div>
    `)

    modalSwitchLogic($modalCoinsEl, coin)

    return $modalCoinsEl
}

function modalSwitchLogic($modalCoinsEl, coin) {
    const $modalCoinInput = $modalCoinsEl.find(`.switch${coin.id}`)
    $modalCoinInput.on('change', (e) => {
        if (e.target.checked === false) {
            STATE.turnedOffCoins.push(coin.id)
        } else {
            const currentOffCoinIndex = findOffCoinIndex(coin.id);
            STATE.turnedOffCoins.splice(currentOffCoinIndex, 1);
        }
    })
};

function findOffCoinIndex(coinId) {
    return STATE.turnedOffCoins.findIndex(offCoin => {
        return offCoin === coinId
    })
}

function coinInfoApi(coinId, onMoreInfoFetched) {
    $.ajax(`${MORE_INFO_API}/${coinId}`, {
        method: 'GET',
        dataType: 'json',
        beforeSend: () => {
            $(".moreInfo-loader").fadeIn(500);
        },
        success: moreInfo => {
            onMoreInfoFetched(moreInfo);
        },
    });

};

function onSubmitSearch(e) {
    e.preventDefault();
    const form = e.target;
    const searchVal = form.searchInput.value.toLowerCase();
    if (searchVal) {
        ELEMENTS.$coinListDiv.find(`.${INDIVIDUAL_CARD_CLASS_NAME}`).hide();
        const currentCoin = findCoin(searchVal);
        const $currentComponent = createCoinComponent(currentCoin)
        ELEMENTS.$coinListDiv.append($currentComponent);

    } else {
        ELEMENTS.$coinListDiv.find(`.${INDIVIDUAL_CARD_CLASS_NAME}`).show();
    }

    STATE.modalDisplayerCounter.forEach(currentCoin => {
        const $switch = ELEMENTS.$coinListDiv.find(`.switch${currentCoin}`);
        $switch.prop('checked', true);
    }
    )
}

function findCoin(searchVal) {
    return STATE.coins.find(currentCoin => {
        return currentCoin.symbol.toLowerCase() === searchVal
    });
};

function displayModalComponent($output, coin) {
    const $modalEl = $(`
      <div class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
            <div class="modal-header">
                <div>
                Replace one or more coins to continue
                </div>
            </div>
                <div class="modal-body">
                    <div class="container">
                        <div class="row">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="closeBtn btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="button" class="saveChanges btn btn-primary">Save changes</button>
                </div>
          </form>
        </div>
    </div>
</div>
`)

    appendCoinsToModal($modalEl)

    const $saveChangesBtnEl = $modalEl.find('.saveChanges');
    $saveChangesBtnEl.on('click', () => {
        STATE.turnedOffCoins.forEach(offCoin => {
            if (STATE.turnedOffCoins.length === 0) {
                $(`.switch${coin.id}`).prop('checked', false);
                $modalEl.modal('hide');
            } else {
                $(`.switch${offCoin}`).prop('checked', false);
            }
        })

        spliceFromMainArrAfterChanges($modalEl)

        modalCoinDisplayManagement()

        if (STATE.modalDisplayerCounter.length === 6) {
            $($output).find(`.switch${coin.id}`).prop('checked', false);
            spliceLastCoinInArr()
        }


        $modalEl.modal('hide');
    });

    const $closeBtnEl = $modalEl.find('.closeBtn');
    $closeBtnEl.on('click', () => {
        if (STATE.modalDisplayerCounter.length === 6) {
            $($output).find(`.switch${coin.id}`).prop('checked', false);
            spliceLastCoinInArr()
        };
        $modalEl.modal('hide');
    });

    $modalEl.modal('show');
};

function displayLiveReports() {
    ELEMENTS.$liveReportsEl.show();

    let coinsCurrencies = {};

    const currencyGraphCoins = STATE.markedCoinSymbols.map(symbol => symbol.toLocaleUpperCase());
    currencyGraphCoins.forEach(currencyGraphCoin => coinsCurrencies[currencyGraphCoin] = [])

    const graphCoinList = currencyGraphCoins.join(',');

    function FetchData() {
        $.ajax(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${graphCoinList}&tsyms=USD`, {
            method: 'GET',
            beforeSend: () => {
                ELEMENTS.$secondApiLoaderEl.fadeOut(500);
            },
            success: data => {
                let time = new Date();
                if (!data.Response) {
                    for (let currentCoinSymbol in data) {
                        coinsCurrencies[currentCoinSymbol].push({ x: time, y: data[currentCoinSymbol].USD })
                    }
                }
                displayGraph();
            },
            complete: () => {
                ELEMENTS.$loaderEl.fadeOut(500);
            }
        })
    };
    STATE.liveReportTimer = setInterval(function () {
        FetchData();
    }, 2000);

    function displayGraph() {
        const chart = new CanvasJS.Chart("liveReports", {
            exportEnabled: true,
            animationEnabled: false,
            title: {
                text: `Chosen Coins.`
            },
            subtitles: [{
                text: "Hover the charts to see the coin value"
            }],
            axisX: {
                valueFormatString: "HH:mm:ss"

            },
            axisY: {
                title: "Coin Value",
                titleFontColor: "#4F81BC",
                lineColor: "#4F81BC",
                labelFontColor: "#4F81BC",
                tickColor: "#4F81BC",
                includeZero: false
            },
            axisY2: {
                title: "",
                titleFontColor: "#C0504E",
                lineColor: "#C0504E",
                labelFontColor: "#C0504E",
                tickColor: "#C0504E",
                includeZero: false
            },
            toolTip: {
                shared: true
            },
            legend: {
                cursor: "pointer",
                itemclick: toggleDataSeries
            },
            data: currencyGraphCoins.map(currentCoinSymbol => coinChartLine(currentCoinSymbol))
        });

        function coinChartLine(currentCoinSymbol) {
            return {
                type: "spline",
                name: currentCoinSymbol,
                showInLegend: true,
                xValueFormatString: "HH:mm:ss",
                dataPoints: coinsCurrencies[currentCoinSymbol],
            };
        };
        chart.render();

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            };
            e.chart.render();
        };
    };
};

function restoreLiveReportTimer() {
    if (STATE.liveReportTimer) {
        clearInterval(STATE.liveReportTimer);
    }
    ELEMENTS.$liveReportsEl.hide();
    STATE.liveReportTimer = null;

    ELEMENTS.$coinListDiv.find(`.${INDIVIDUAL_CARD_CLASS_NAME}`).show();
}

function modalCoinDisplayManagement() {
    const coinToAddToModal = _.last(STATE.modalDisplayerCounter)
    const coinToAddToModalObj = STATE.coins.find(currentCoinToAddToModal => {
        return coinToAddToModal === currentCoinToAddToModal.id
    })

    STATE.markedCoinSymbols.push(coinToAddToModalObj.symbol);

    STATE.turnedOffCoins.length = 0
}

function spliceFromMainArrAfterChanges($modalEl) {
    const offCoinsToBeSpliced = _.intersection(STATE.modalDisplayerCounter, STATE.turnedOffCoins)
    offCoinsToBeSpliced.forEach(coinToBeSpliced => {
        const coinToBeSplicedIndex = findCoinToBeSplicedIndex(coinToBeSpliced)

        STATE.modalDisplayerCounter.splice(coinToBeSplicedIndex, 1);
        console.log(STATE.modalDisplayerCounter)
        STATE.markedCoinSymbols.splice(coinToBeSplicedIndex, 1);
        console.log(STATE.markedCoinSymbols)
        $modalEl.find(`.cardTile${coinToBeSpliced}`).remove();

    })

    function findCoinToBeSplicedIndex(coinId) {
        return STATE.modalDisplayerCounter.findIndex(currentCoinToBeSpliced => {
            return currentCoinToBeSpliced === coinId
        })
    }
}

function appendCoinsToModal($modalEl) {
    const $modalRowEl = $modalEl.find('.row');
    STATE.markedCoinSymbols.forEach(symbol => {
        const coin = STATE.coins.find(coin => coin.symbol === symbol);
        const $modalCoinEl = createModalCoinsComponent(coin)
        $modalRowEl.append($modalCoinEl);
    });
}

function spliceLastCoinInArr() {
    const coinToBeSpliced = _.last(STATE.modalDisplayerCounter);
    const coinToBeSplicedIndex = findCurrentIndex(coinToBeSpliced)
    STATE.modalDisplayerCounter.splice(coinToBeSplicedIndex, 1)
    STATE.markedCoinSymbols.splice(coinToBeSplicedIndex, 1)
}

function lengthCheck($output, coin) {
    console.log(coin)
    if (STATE.modalDisplayerCounter.length > 5) {
        Modal($output, coin)
    };
}

function spliceFromArr(id) {
    const currentIndex = findCurrentIndex(id)
    STATE.modalDisplayerCounter.splice(currentIndex, 1)
    STATE.markedCoinSymbols.splice(currentIndex, 1)
}

function findCurrentIndex(id) {
    return STATE.modalDisplayerCounter.findIndex(currentIndex => currentIndex === id)
}

function onChangeSwitch($component, coin) {
    $switchEl = $component.find(`.switch${coin.id}`);

    $switchEl.on('change', (e) => {
        if (e.target.checked) {
            STATE.modalDisplayerCounter.push(coin.id);
            ELEMENTS.$coinListDiv.find(`.switch${coin.id}`).prop('checked', true);

            if (STATE.modalDisplayerCounter.length <= 5) {
                STATE.markedCoinSymbols.push(coin.symbol);
            };

            lengthCheck($component, coin)
        } else {
            spliceFromArr(coin.id);
            ELEMENTS.$coinListDiv.find(`.switch${coin.id}`).prop('checked', false);
        }
    });
}

function showSearchTab() {
    ELEMENTS.$loginFormEl.show();
}

function hideSearchTab() {
    ELEMENTS.$loginFormEl.hide();
}

main();