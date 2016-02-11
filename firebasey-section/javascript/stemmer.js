(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var stemmer = require('./stemmer')

window["stemmer"] = require('./langs/english')

},{"./langs/english":2,"./stemmer":3}],2:[function(require,module,exports){
var stemmer = require('../stemmer')
  , alphabet = "abcdefghijklmnopqrstuvwxyz"
  , vowels = "aeiouy"
  , consonants = alphabet.replace(RegExp("[" + vowels + "]", "g"), "") + "Y"
  , v_wxy = vowels + "wxY"
  , valid_li = "cdeghkmnrt"
  , r1_re = RegExp("^.*?([" + vowels + "][^" + vowels + "]|$)")
  , r1_spec = /^(gener|commun|arsen)/
  , doubles = /(bb|dd|ff|gg|mm|nn|pp|rr|tt)$/
  , y_cons = RegExp("([" + vowels + "])y", "g")
  , y_suff = RegExp("(.[^" + vowels + "])[yY]$")
  , exceptions1 =
    { skis: "ski"
    , skies: "sky"
    , dying: "die"
    , lying: "lie"
    , tying: "tie"

    , idly: "idl"
    , gently: "gentl"
    , ugly: "ugli"
    , early: "earli"
    , only: "onli"
    , singly: "singl"

    , sky: "sky"
    , news: "news"
    , howe: "howe"

    , atlas: "atlas"
    , cosmos: "cosmos"
    , bias: "bias"
    , andes: "andes"
    }
  , exceptions2 =
    [ "inning", "outing", "canning", "herring", "earring"
    , "proceed", "exceed", "succeed"
    ]


module.exports = function(word) {
  // Exceptions 1
  var stop = stemmer.except(word, exceptions1)
  if (stop) return stop

  // No stemming for short words.
  if (word.length < 3) return word

  // Y = "y" as a consonant.
  if (word[0] === "y") word = "Y" + word.substr(1)
  word = word.replace(y_cons, "$1Y")

  // Identify the regions of the word.
  var r1, m
  if (m = r1_spec.exec(word)) {
    r1 = m[0].length
  } else {
    r1 = r1_re.exec(word)[0].length
  }

  var r2 = r1 + r1_re.exec(word.substr(r1))[0].length

  // Step 0
  word = word.replace(/^'/, "")
  word = word.replace(/'(s'?)?$/, "")

  // Step 1a
  word = stemmer.among(word,
    [ "sses", "ss"
    , "(ied|ies)", function(match, _, offset) {
        return (offset > 1) ? "i" : "ie"
      }
    , "([" + vowels + "].*?[^us])s", function(match, m1) { return m1 }
    ])

  stop = stemmer.except(word, exceptions2)
  if (stop) return stop

  // Step 1b
  word = stemmer.among(word,
    [ "(eed|eedly)", function(match, _, offset) {
        return (offset >= r1) ? "ee" : match + " "
      }
    , ("([" + vowels + "].*?)(ed|edly|ing|ingly)"), function(match, prefix, suffix, off) {
        if (/(?:at|bl|iz)$/.test(prefix)) {
          return prefix + "e"
        } else if (doubles.test(prefix)) {
          return prefix.substr(0, prefix.length - 1)
        } else if (shortv(word.substr(0, off + prefix.length)) && off + prefix.length <= r1) {
          return prefix + "e"
        } else {
          return prefix
        }
      }
    ])

  // Step 1c
  word = word.replace(y_suff, "$1i")

  // Step 2
  word = stemmer.among(word, r1,
    [ "(izer|ization)", "ize"
    , "(ational|ation|ator)", "ate"
    , "enci", "ence"
    , "anci", "ance"
    , "abli", "able"
    , "entli", "ent"
    , "tional", "tion"
    , "(alism|aliti|alli)", "al"
    , "fulness", "ful"
    , "(ousli|ousness)", "ous"
    , "(iveness|iviti)", "ive"
    , "(biliti|bli)", "ble"
    , "ogi", function(m, off) {
        return (word[off - 1] === "l") ? "og" : "ogi"
      }
    , "fulli", "ful"
    , "lessli", "less"
    , "li", function(m, off) {
        return ~valid_li.indexOf(word[off - 1]) ? "" : "li"
      }
    ])

  // Step 3
  word = stemmer.among(word, r1,
    [ "ational", "ate"
    , "tional", "tion"
    , "alize", "al"
    , "(icate|iciti|ical)", "ic"
    , "(ful|ness)", ""
    , "ative", function(m, off) {
        return (off >= r2) ? "" : "ative"
      }
    ])

  // Step 4
  word = stemmer.among(word, r2,
    [ "(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ism|ate|iti|ous|ive|ize)", ""
    , "ion", function(m, off) {
        return ~"st".indexOf(word[off - 1]) ? "" : m
      }
    ])

  // Step 5
  word = stemmer.among(word, r1,
    [ "e", function(m, off) {
        return (off >= r2 || !shortv(word, off - 2)) ? "" : "e"
      }
    , "l", function(m, off) {
        return (word[off - 1] === "l" && off >= r2) ? "" : "l"
      }
    ])

  word = word.replace(/Y/g, "y")

  return word
}


// Check for a short syllable at the given index.
// Examples:
//
//   rap
//   trap
//   entrap
//
// NOT short
//
//   uproot
//   bestow
//   disturb
//
function shortv(word, i) {
  if (i == null) i = word.length - 2
  if (word.length < 3) i = 0//return true
  return !!((!~vowels.indexOf(word[i - 1]) &&
              ~vowels.indexOf(word[i]) &&
             !~v_wxy.indexOf(word[i + 1]))
         || (i === 0 &&
              ~vowels.indexOf(word[i]) &&
             !~vowels.indexOf(word[i + 1])))
}

},{"../stemmer":3}],3:[function(require,module,exports){
var stemmer = {}
  , cache = {}

module.exports = stemmer

stemmer.except = function(word, exceptions) {
  if (exceptions instanceof Array) {
    if (~exceptions.indexOf(word)) return word
  } else {
    for (var k in exceptions) {
      if (k === word) return exceptions[k]
    }
  }
  return false
}


// word - String
// offset - Integer (optional)
// replace - Key/Value Array of pattern, string, and function.
stemmer.among = function among(word, offset, replace) {
  if (replace == null) return among(word, 0, offset)

  // Store the intial value of the word.
  var initial = word.slice()
    , pattern, replacement

  for (var i = 0; i < replace.length; i+=2) {
    pattern = replace[i]
    pattern = cache[pattern] || (cache[pattern] = new RegExp(replace[i] + "$"))
    replacement = replace[i + 1]

    if (typeof replacement === "function") {
      word = word.replace(pattern, function(m) {
        var off = arguments["" + (arguments.length - 2)]
        if (off >= offset) {
          return replacement.apply(null, arguments)
        } else {
          return m + " "
        }
      })
    } else {
      word = word.replace(pattern, function(m) {
        var off = arguments["" + (arguments.length - 2)]
        return (off >= offset) ? replacement : m + " "
      })
    }

    if (word !== initial) break
  }

  return word.replace(/ /g, "")
}

},{}]},{},[1]);
