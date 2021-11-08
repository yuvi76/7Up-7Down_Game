let sPlayername, userData;

function validateEmpty(name) {
    var re = /^(?![\s-])[\w\s-]+$/;
    return re.test(String(name));
}

$(document).ready(function () {
    $("#login").bind("click", login);
    $("#logoutBtn").bind("click", logOut);
    $("#play").on("click", enterQueue);
    $("#placeBid").on("click", placeBid);

    if (sessionStorage) {
        userData = JSON.parse(sessionStorage.getItem("userData"));
        if (userData) {
            $("#logoutBtn").show();
            $("#start").hide();
        } else {
            $("#logoutBtn").hide();
        }
        if (userData) {
            // Get user game details
            sPlayername = userData.sPlayername;
            $.ajax({
                type: "GET",
                url: "/api/v1/user/" + userData.sPlayername,
                success: function (result, status, xhr) {
                    navigateTo(result.data);
                },
                error: function (xhr, status, error) {
                    // console.log(xhr);
                    alert(xhr.responseJSON.message);
                    return;
                }
            });

        }
    }

});

function login() {
    $('#login').attr("disabled", true);
    let sPlayername = $('#username').val();

    if (sPlayername == '') {
        $('#login').attr("disabled", false);

        alert('Please fill out Name field');
        return;
    } else {
        let oOptions = {
            'sPlayername': sPlayername
        };
        $.ajax({
            type: "POST",
            url: "/api/v1/auth/login",
            data: oOptions,
            success: function (result, status, xhr) {
                console.log(result.data);
                $('#login').attr("disabled", false);
                if (sessionStorage) {
                    let sessionData = {
                        _id: result.data.user._id,
                        sPlayername: result.data.user.sPlayername
                    }
                    userData = sessionData
                    sessionStorage.setItem("userData", JSON.stringify(sessionData));
                    navigateTo(result.data);
                }
            },
            error: function (xhr, status, error) {
                $('#login').attr("disabled", false);
                console.log(xhr);
                return;
            }
        });
    }
}

function logOut() {
    if (sessionStorage) {
        sessionStorage.removeItem("userData");
    }
    $("#login-screen").show();
    $("#start,#logoutBtn").hide();

}

function navigateTo(data) {
    console.log("navigate o : ", data);
    $("#login-screen").hide();
    $("#logoutBtn").show();

    initSocket()

    $("#start").show();
}

function enterQueue() {
    socket.emit("enter queue");
}

function enterMatch() {
    $("#bidDiv").css("display", "block");
}

function placeBid() {
    let bidAmount = 0;
    let bid = $("input[type='radio'][name='bid']:checked").val();
    bidAmount = $("#bidAmount").val();
    let oOptions = {
        nCoin: bidAmount
    }
    $.ajax({
        type: "PUT",
        url: "/api/v1/user/placeBid/" + userData.sPlayername,
        data: oOptions,
        success: function (result, status, xhr) {
            console.log(result);
        },
        error: function (xhr, status, error) {
            console.log(xhr);
            return;
        }
    });
    socket.emit("place bid", bid, bidAmount);
}

function result(coinAmount) {

    let oOptions = {
        nCoin: coinAmount
    }
    $.ajax({
        type: "PUT",
        url: "/api/v1/user/gameResult/" + userData.sPlayername,
        data: oOptions,
        success: function (result, status, xhr) {
            console.log(result);
        },
        error: function (xhr, status, error) {
            console.log(xhr);
            return;
        }
    });
}
function initSocket() {
    window.socket = io();
    window.socket.on('connect', () => {

    })

    window.socket.on('timer', function (data) {
        if (data.bidTime >= 0)
            $('#timer').html(data.bidTime);
    });

    window.socket.on("enter match", function () {
        enterMatch();
    });

    window.socket.on("result", function (coinAmount, playerId) {
        if (playerId == window.socket.id) {
            result(coinAmount, playerId);
        }
    });

    window.socket.on("rematch", function () {
        socket.emit("rematch");
    });

}
