// JUNOFORMAT.JS
// Reese Norris 2020

// Define important global variables
const alphabet = "abcdefghijklmnopqrstuvwxyz";
var finalResult = "";
var indentRef = 0;

// Listens for pastes and starts parser
document.addEventListener('paste', function(e) {
    e.preventDefault();
    finalResult = "";
    var pastedText = '';

    clipdata = e.clipboardData || window.clipboardData;
    pastedText = clipdata.getData('text/html');

    document.getElementById('dump').innerHTML = pastedText; // consider removing this for production

    // Start parsing
    fixHtml(pastedText);
    copyToClip(finalResult);
    document.getElementById('dump').innerHTML = "All fixed and re-copied! Now go paste into Juno Docs.";
    console.log(finalResult);
    //setTimeout(() => {  document.getElementById('dump').innerHTML = "Copy your text from Google Docs then paste anywhere on this page."; }, 5000);
});

document.addEventListener('copy', copyToClip());

function copyToClip(str) {
    function listener(e) {
        e.clipboardData.setData("text/html", str);
        e.clipboardData.setData("text/plain", str);
        e.preventDefault();
    }
    document.addEventListener("copy", listener);
    document.execCommand("copy");
    document.removeEventListener("copy", listener);
}

// Beginning function spools up parser
function fixHtml(str) {
    console.log(`Raw str: ${str}`);
    var domparser = new DOMParser();
    var fullDoc = domparser.parseFromString(str, "text/html");
    console.log(fullDoc);
    parseLoop(fullDoc.getElementsByTagName("B")[0].childNodes);
}

// Main parse loop, recursively calls itself and truncates through each node given from the paste dump
function parseLoop(nodes, listIndex) {
    console.log(`Parsing new nodelist with length ${nodes.length}`);
    for (let thisNode of nodes) {
        switch (thisNode.nodeName) {
            case "P":
                console.log("Found P");
                if (thisNode.style.textIndent !== "") {
                    finalResult += "        ";
                }
                parseLoop(thisNode.childNodes);
                finalResult += "<br>";
                break;
            case "BR":
                console.log("Found BR");
                finalResult += "<br>";
                break;
            case "SPAN":
                console.log("Found SPAN");
                parseSpan(thisNode);
                parseLoop(thisNode.childNodes);
                break;
            case "OL":
                console.log("Found OL");
                var thisListIndex = {};
                thisListIndex.number = 0;
                console.log(`Created list index for this ordered list: ${thisListIndex}`);
                indentRef = indentRef + 1;
                parseLoop(thisNode.childNodes, thisListIndex);
                indentRef = indentRef - 1;
                console.log(`This ordered list resulted with a listIndex of ${thisListIndex.number}`);
                break;
            case "UL":
                console.log("Found UL");
                indentRef = indentRef + 1;
                parseLoop(thisNode.childNodes);
                indentRef = indentRef - 1;
                break;
            case "LI":
                console.log("Found LI");
                if (listIndex !== undefined) {
                    console.log(`listIndex passed to this LI: ${listIndex.number}`);
                    listIndex.number += 1;
                }
                insertIndentRef();
                insertListCharacter(thisNode, listIndex);
                parseLoop(thisNode.childNodes);
                break;
            default:
                if (thisNode.innerText === undefined) {
                    console.log(`[undefined] Nodelist finished`)
                }
                else {
                    console.log(`Did not find a match for ${thisNode.innerText}`)
                }
        }
    }
}

// Accepts SPAN node object and parses text
function parseSpan(spanItem) {
    var isThisBold = false;
    var isThisItalic = false;
    var isThisUnderlined = false;

    if (spanItem.style.fontStyle === "italic") {
        isThisItalic = true;
        finalResult += "<i>";
    }
    if (spanItem.style.fontWeight === "700") {
        isThisBold = true;
        finalResult += "<b>";
    }
    if (spanItem.style.textDecoration === "underline") {
        isThisUnderlined = true;
        finalResult += "<u>";
    }

    finalResult += spanItem.innerText;

    if (isThisUnderlined) {
        finalResult += "</u>";
    }
    if (isThisBold) {
        finalResult += "</b>";
    }
    if (isThisItalic) {
        finalResult += "</i>";
    }
}

// Inserts the correct amount of indents according to the existing indentRef value
function insertIndentRef() {
    var loopRef = 0;
    while (loopRef < indentRef) {
        console.log("Adding indent (8 spaces)");
        finalResult += "        ";
        loopRef = loopRef + 1;
    }
}

// Inserts the correct character/number to put in front of unordered and ordered lists
function insertListCharacter(node, listIndex) {
    console.log(`Inserting list character: ${node.style.listStyleType}`);
    var listCharacter = (function(listStyleType) {
        if (listIndex !== undefined) {
            var alphaPosition = function() {
                if (listIndex.number % 26 === 0) {
                    return 25;
                }
                else {
                    return ((listIndex.number % 26) - 1);
                }
            }();
            switch(listStyleType) {
                case "decimal":
                    return listIndex.number + ".";
                case "lower-alpha":
                    console.log(`Will add letter with position ${alphaPosition}`);
                    return alphabet.charAt(alphaPosition) + ".";
                case "upper-alpha":
                    console.log(`Will add letter with position ${alphaPosition}`);
                    return alphabet.charAt(alphaPosition).toUpperCase() + ".";
                case "lower-roman":
                    return romanize(listIndex.number).toLowerCase() + ".";
                case "upper-roman":
                    return romanize(listIndex.number) + ".";
            }
        }
        switch(listStyleType) {
            case "disc":
                return "&bull;";
            case "circle":
                return "&#9900;";
            case "square":
                return "&#9632;";
            default:
                return "&bull;";
        }
    })(node.style.listStyleType);
    finalResult += `${listCharacter} `;
}

function romanize (num) {
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
            "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
            "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}