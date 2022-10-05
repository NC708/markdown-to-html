import fs from 'fs';
import path from 'path'

// Dictionary of line initializers
const initializerDict = {
    '#': 'h1',
    '##': 'h2',
    '###': 'h3',
    '####': 'h4',
    '#####': 'h5',
    '######': 'h6',
};

function processInlines(line) {
    const keyDict = {'[': ']', '(': ')'} // Inline keys: {startKey: endKey, ...}
    let sections = []; // Keeps track of bracketed sections: [{type: '(', start: 0, end: 10]}] 

    const keys = Object.keys(keyDict);
    function findMatchingBracket(startKey, i) { // Recursively finds bracket matches and adds them to the "sections" array
        const endKey = keyDict[startKey];
        for(let j = i + 1; j < line.length; j++) {
            if(line[j] == endKey) {
                sections.push({type: startKey, start: i, end:j});
                return j;
            }
            if(keys.includes(line[j])) {
                j = findMatchingBracket(line[j], j);
                continue;
            }
        }
    }

    for (let i = 0; i < line.length; i++) {
        let keyStack = 0;
        if (keys.includes(line[i])) {
            i = findMatchingBracket(line[i], i)
        }
    }

    // Check for corresponding anchor/href pairs
    let anchors = [] //{text, href, start, end}
    for (let i = 0; i < sections.length - 1; i++) {
        if (sections[i].type == '[' && sections[i + 1].type == '(') {
            if (sections[i].end == sections[i + 1].start - 1) {
                const href = line.slice(sections[i + 1].start + 1, sections[i + 1].end);
                const text = line.slice(sections[i].start + 1, sections[i].end);
                anchors.push({text: text, href: href, start: sections[i].start, end: sections[i + 1].end + 1});
            }
        }
    }

    // Create and return new line
    if(anchors.length) {
        let processedLine = '';
        processedLine += line.slice(0, anchors[0].start);
        for(let i = 0; i < anchors.length; i++) {
            processedLine += `<a href='${anchors[i].href}'>${anchors[i].text}</a>`;
            processedLine += line.slice(anchors[i].end, anchors[i + 1]?.start || line.length);;
        }
        return processedLine
    }
    return line;
}

function toHtml(inputName, outputName) {
    const input = fs.readFileSync(inputName).toString().split((process.platform == 'win32') ? '\r\n' : '\n');
    let mainDivs = [];

    // Parse into "main" divs (headers and paragraphs)
    for (let i = 0; i < input.length; i++) {
        if (input[i].trim().length == 0) continue;

        let line = processInlines(input[i]);
        const parsed = line.split(' ');

        // Handle formatted text
        if (initializerDict[parsed[0]]) {
            mainDivs.push({tag: initializerDict[parsed[0]], data: parsed.slice(1, parsed.length).join(' ')});
            continue;
        }

        // Handle unformatted text
        if (mainDivs[mainDivs.length - 1]?.tag == 'p') {
            mainDivs[mainDivs.length - 1].data += `<br />${line}`
        }
        else {
            mainDivs.push({tag: 'p', data: line})
        }
    }
    const outString = mainDivs.map((div) => `<${div.tag}>${div.data}</${div.tag}>`).join('\n')
    fs.writeFileSync(outputName, outString)
}

function main() {
    const tests = fs.readdirSync('tests')
    tests.forEach((testFileName) => {
        toHtml('tests/' + testFileName,'outputs/' + path.parse(testFileName).name + '.html');
    })
}

main();