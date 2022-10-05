import fs from 'fs';

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
    const keyDict = {'[': ']', '(': ')'}
    let sections = []; // [{type: '(', start: 0, end: 10]}]

    const keys = Object.keys(keyDict);
    function findMatchingBracket(startKey, i) {
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
    console.log(sections)

    // Check for corresponding anchor/href pair
    let processedLine = line.concat()
    for (let i = 0; i < sections.length - 1; i++) {
        if (sections[i].type == '[' && sections[i + 1].type == '(') {
            if (sections[i].end == sections[i + 1].start - 1) {
                const href = line.slice(sections[i + 1].start + 1, sections[i + 1].end);
                processedLine = `${processedLine.slice(0, sections[i].start)}<a href='${href}'>${processedLine.slice(sections[i].start + 1, sections[i].end)}</a>${processedLine.slice(sections[i + 1].end + 1)}`
            }
        }
    }

    return processedLine;
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
            mainDivs.push({tag: initializerDict[parsed[0]], data: line});
            continue;
        }

        // Handle unformatted text
        if (mainDivs[mainDivs.length - 1].tag == 'p') {
            mainDivs[mainDivs.length - 1].data += `<br />${line}`
        }
        else {
            mainDivs.push({tag: 'p', data: parsed.join(' ')})
        }
    }
    console.log(mainDivs)
    const outString = mainDivs.map((div) => `<${div.tag}>${div.data}</${div.tag}>`).join('\n')
    fs.writeFileSync(outputName, outString)
}

function main() {
    toHtml('./tests/test.md', 'output.html');
}

main();