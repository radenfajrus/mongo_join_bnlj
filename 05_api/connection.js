
var conns = {}

var ConnManager = {
    all : () => {
        return conns
    },
}

module.exports = {
    conns,
    ConnManager
}