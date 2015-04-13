(function() {
    function n(n, a, r) {
        for (var e, s, o, m = -1, u = 2 * Math.PI / a, b = 0, h = []; ++m < a;) e = n.m * (m * u - Math.PI) / 4, e = Math.pow(Math.abs(Math.pow(Math.abs(Math.cos(e) / n.a), n.n2) + Math.pow(Math.abs(Math.sin(e) / n.b), n.n3)), -1 / n.n1), e > b && (b = e), h.push(e);
        for (b = r * Math.SQRT1_2 / b, m = -1; ++m < a;) s = (e = h[m] * b) * Math.cos(m * u), o = e * Math.sin(m * u), h[m] = [Math.abs(s) < 1e-6 ? 0 : s, Math.abs(o) < 1e-6 ? 0 : o];
        return t(h) + "Z"
    }
    var a = d3.svg.symbol(),
        t = d3.svg.line();
    d3.superformula = function() {
        function t(a, t) {
            var u, b = r[e.call(this, a, t)];
            for (u in m) b[u] = m[u].call(this, a, t);
            return n(b, o.call(this, a, t), Math.sqrt(s.call(this, a, t)))
        }
        var e = a.type(),
            s = a.size(),
            o = s,
            m = {};
        return t.type = function(n) {
            return arguments.length ? (e = d3.functor(n), t) : e
        }, t.param = function(n, a) {
            return arguments.length < 2 ? m[n] : (m[n] = d3.functor(a), t)
        }, t.size = function(n) {
            return arguments.length ? (s = d3.functor(n), t) : s
        }, t.segments = function(n) {
            return arguments.length ? (o = d3.functor(n), t) : o
        }, t
    };
    var r = {
        circle: {
            m: 2,
            n1: 2,
            n2: 2,
            n3: 2,
            a: 1,
            b: 1
        },
        square: {
            m: 4,
            n1: 100,
            n2: 100,
            n3: 100,
            a: 1,
            b: 1
        },
        triangle: {
            m: 3,
            n1: 100,
            n2: 200,
            n3: 200,
            a: 1,
            b: 1
        },
        asterisk: {
            m: 12,
            n1: .3,
            n2: 0,
            n3: 10,
            a: 1,
            b: 1
        },
        roundedStar: {
            m: 5,
            n1: 2,
            n2: 7,
            n3: 7,
            a: 1,
            b: 1
        },
        cross: {
            m: 8,
            n1: 1.3,
            n2: .01,
            n3: 8,
            a: 1,
            b: 1
        },
        bean: {
            m: 2,
            n1: 1,
            n2: 4,
            n3: 8,
            a: 1,
            b: 1
        },
        butterfly: {
            m: 3,
            n1: 1,
            n2: 6,
            n3: 2,
            a: .6,
            b: 1
        },
        clover: {
            m: 6,
            n1: .3,
            n2: 0,
            n3: 10,
            a: 1,
            b: 1
        },
        cloverFour: {
            m: 8,
            n1: 10,
            n2: -1,
            n3: -8,
            a: 1,
            b: 1
        },
        diamond: {
            m: 4,
            n1: 1,
            n2: 1,
            n3: 1,
            a: 1,
            b: 1
        },
        drop: {
            m: 1,
            n1: .5,
            n2: .5,
            n3: .5,
            a: 1,
            b: 1
        },
        ellipse: {
            m: 4,
            n1: 2,
            n2: 2,
            n3: 2,
            a: 9,
            b: 6
        },
        gear: {
            m: 19,
            n1: 100,
            n2: 50,
            n3: 50,
            a: 1,
            b: 1
        },
        heart: {
            m: 1,
            n1: .8,
            n2: 1,
            n3: -8,
            a: 1,
            b: .18
        },
        heptagon: {
            m: 7,
            n1: 1e3,
            n2: 400,
            n3: 400,
            a: 1,
            b: 1
        },
        hexagon: {
            m: 6,
            n1: 1e3,
            n2: 400,
            n3: 400,
            a: 1,
            b: 1
        },
        malteseCross: {
            m: 8,
            n1: .9,
            n2: .1,
            n3: 100,
            a: 1,
            b: 1
        },
        pentagon: {
            m: 5,
            n1: 1e3,
            n2: 600,
            n3: 600,
            a: 1,
            b: 1
        },
        rectangle: {
            m: 4,
            n1: 100,
            n2: 100,
            n3: 100,
            a: 2,
            b: 1
        },
        star: {
            m: 5,
            n1: 30,
            n2: 100,
            n3: 100,
            a: 1,
            b: 1
        },
        newShape0: {
            a: 0.9,
            b: 1,
            m: 12,
            n1: 10,
            n2: 10,
            n3: 0
        },
        newShape1: {
            a: 0.8,
            b: 1,
            m: 12,
            n1: 10,
            n2: 10,
            n3: 0
        },
        newShape2: {
            a: 0.8,
            b: 1,
            m: 16,
            n1: 10,
            n2: 10,
            n3: 0
        },
        newShape3: {
            a: 0.75,
            b: 1,
            m: 4,
            n1: 10,
            n2: 10,
            n3: 0
        },
        newShape4: {
            a: 0.75,
            b: 1,
            m: 8,
            n1: 10,
            n2: 10,
            n3: 0
        },
        newShape5: {
            a: 0.75,
            b: 1,
            m: 12,
            n1: 10,
            n2: 10,
            n3: 0
        },
        newShape6: {
            a: 0.75,
            b: 1,
            m: 16,
            n1: 10,
            n2: 10,
            n3: 0
        },
        newShape7: {
            a: 0.75,
            b: 1,
            m: 20,
            n1: 10,
            n2: 10,
            n3: 0
        },
        newShape8: {
            a: 0.75,
            b: 1,
            m: 24,
            n1: 10,
            n2: 10,
            n3: 0
        },
        newShape9: {
            a: 0.75,
            b: 1,
            m: 28,
            n1: 10,
            n2: 10,
            n3: 0
        },
        newShape10: {
            a: 0.5,
            b: 1,
            m: 4,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape11: {
            a: 0.5,
            b: 1,
            m: 8,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape12: {
            a: 0.5,
            b: 1,
            m: 12,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape13: {
            a: 0.5,
            b: 1,
            m: 16,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape14: {
            a: 0.5,
            b: 1,
            m: 20,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape15: {
            a: 0.5,
            b: 1,
            m: 24,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape16: {
            a: 0.25,
            b: 1,
            m: 2,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape17: {
            a: 0.25,
            b: 1,
            m: 6,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape18: {
            a: 0.25,
            b: 1,
            m: 10,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape19: {
            a: 0.25,
            b: 1,
            m: 14,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape20: {
            a: 0.9,
            b: 1,
            m: 4,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape21: {
            a: 0.9,
            b: 1,
            m: 8,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape22: {
            a: 0.9,
            b: 1,
            m: 12,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape23: {
            a: 0.9,
            b: 1,
            m: 16,
            n1: 50,
            n2: 50,
            n3: 0
        },
        newShape24: {
            a: 1,
            b: 1,
            m: 2,
            n1: 10,
            n2: 10,
            n3: 10
        },
        newShape25: {
            a: 1,
            b: 1,
            m: 3,
            n1: 10,
            n2: 10,
            n3: 10
        },
        newShape26: {
            a: 1,
            b: 1,
            m: 4,
            n1: 10,
            n2: 10,
            n3: 10
        },
        newShape27: {
            a: 1,
            b: 1,
            m: 5,
            n1: 10,
            n2: 10,
            n3: 10
        },
        newShape28: {
            a: 1,
            b: 1,
            m: 6,
            n1: 10,
            n2: 10,
            n3: 10
        },
        newShape29: {
            a: 1,
            b: 1,
            m: 7,
            n1: 10,
            n2: 10,
            n3: 10
        },
        newShape30: {
            a: 1,
            b: 1,
            m: 8,
            n1: 10,
            n2: 10,
            n3: 10
        },
        newShape31: {
            a: 1,
            b: 1,
            m: 6,
            n1: 50,
            n2: 50,
            n3: 10
        },
        newShape32: {
            a: 1,
            b: 1,
            m: 8,
            n1: 50,
            n2: 50,
            n3: 10
        },
        newShape33: {
            a: 1,
            b: 1,
            m: 10,
            n1: 50,
            n2: 50,
            n3: 10
        },
        newShape34: {
            a: 1,
            b: 1,
            m: 12,
            n1: 50,
            n2: 50,
            n3: 10
        },
        newShape35: {
            a: 1,
            b: 1,
            m: 14,
            n1: 50,
            n2: 50,
            n3: 10
        },
        newShape36: {
            a: 1,
            b: 1,
            m: 16,
            n1: 50,
            n2: 50,
            n3: 10
        },
        newShape37: {
            a: 1,
            b: 1,
            m: 18,
            n1: 50,
            n2: 50,
            n3: 10
        },
        newShape38: {
            a: 1,
            b: 1,
            m: 20,
            n1: 50,
            n2: 50,
            n3: 10
        },
        newShape39: {
            a: 1,
            b: 1,
            m: 4,
            n1: 5,
            n2: 5,
            n3: 100
        },
        newShape40: {
            a: 1,
            b: 1,
            m: 5,
            n1: 5,
            n2: 5,
            n3: 100
        },
        newShape41: {
            a: 1,
            b: 1,
            m: 6,
            n1: 5,
            n2: 5,
            n3: 100
        },
        newShape42: {
            a: 1,
            b: 1,
            m: 7,
            n1: 5,
            n2: 5,
            n3: 100
        },
        newShape43: {
            a: 1,
            b: 1,
            m: 8,
            n1: 5,
            n2: 5,
            n3: 100
        },
        newShape44: {
            a: 1,
            b: 1,
            m: 9,
            n1: 5,
            n2: 5,
            n3: 100
        },
        newShape45: {
            a: 1,
            b: 1,
            m: 10,
            n1: 5,
            n2: 5,
            n3: 100
        },
        newShape46: {
            a: 1,
            b: 1,
            m: 12,
            n1: 5,
            n2: 5,
            n3: 100
        },
        newShape47: {
            a: 1,
            b: 1,
            m: 16,
            n1: 5,
            n2: 5,
            n3: 100
        },
        newShape48: {
            a: 1,
            b: 1,
            m: 20,
            n1: 5,
            n2: 5,
            n3: 100
        },
        newShape49: {
            a: 1,
            b: 1,
            m: 4,
            n1: 100,
            n2: 15,
            n3: 150
        },
        newShape50: {
            a: 1,
            b: 1,
            m: 6,
            n1: 100,
            n2: 15,
            n3: 150
        },
        newShape50: {
            a: 1,
            b: 1,
            m: 8,
            n1: 100,
            n2: 15,
            n3: 150
        },
        newShape51: {
            a: 1,
            b: 1,
            m: 10,
            n1: 100,
            n2: 15,
            n3: 150
        },
        newShape52: {
            a: 1,
            b: 1,
            m: 12,
            n1: 100,
            n2: 15,
            n3: 150
        },
        newShape53: {
            a: 1,
            b: 1,
            m: 14,
            n1: 100,
            n2: 15,
            n3: 150
        },
        newShape54: {
            a: 1,
            b: 1,
            m: 16,
            n1: 100,
            n2: 15,
            n3: 150
        },
        newShape55: {
            a: 5,
            b: 5,
            m: 6,
            n1: 1,
            n2: 15,
            n3: 5
        },
        newShape56: {
            a: 5,
            b: 5,
            m: 8,
            n1: 1,
            n2: 15,
            n3: 5
        },
        newShape57: {
            a: 5,
            b: 5,
            m: 10,
            n1: 1,
            n2: 15,
            n3: 5
        },
        newShape58: {
            a: 5,
            b: 5,
            m: 12,
            n1: 1,
            n2: 15,
            n3: 5
        },
        newShape59: {
            a: 5,
            b: 5,
            m: 14,
            n1: 1,
            n2: 15,
            n3: 5
        },
        newShape59: {
            a: 5,
            b: 5,
            m: 16,
            n1: 1,
            n2: 15,
            n3: 5
        },
        newShape60: {
            a: 5,
            b: 5,
            m: 6,
            n1: 1,
            n2: 15,
            n3: 10
        },
        newShape61: {
            a: 5,
            b: 5,
            m: 8,
            n1: 1,
            n2: 15,
            n3: 10
        },
        newShape62: {
            a: 5,
            b: 5,
            m: 10,
            n1: 1,
            n2: 15,
            n3: 10
        },
        newShape63: {
            a: 5,
            b: 5,
            m: 12,
            n1: 1,
            n2: 15,
            n3: 10
        },
        newShape64: {
            a: 5,
            b: 5,
            m: 14,
            n1: 1,
            n2: 15,
            n3: 10
        },
        newShape65: {
            a: 5,
            b: 5,
            m: 16,
            n1: 1,
            n2: 15,
            n3: 10
        }
    };
    d3.superformulaTypes = d3.keys(r)
})();