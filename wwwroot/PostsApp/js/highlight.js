// Corrected highlight helper (safe DOM-based highlighting)
let minKeywordLenth = 1;
let showKeywords = true;

function highlight(text, elem) {
    text = (text || '').trim();
    if (text.length < minKeywordLenth) return;

    const normalizedSearch = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Collect text nodes under elem
    const walker = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let n;
    while (n = walker.nextNode()) nodes.push(n);
    if (nodes.length === 0) return;

    // Build normalized character array and map
    const normChars = [];
    const normMap = [];
    for (let i = 0; i < nodes.length; i++) {
        const s = nodes[i].nodeValue;
        for (let j = 0; j < s.length; j++) {
            const ch = s[j];
            const norm = ch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            for (let k = 0; k < norm.length; k++) {
                normChars.push(norm[k]);
                normMap.push({ nodeIndex: i, charIndex: j });
            }
        }
    }
    const normText = normChars.join('');
    if (normText.length === 0) return;

    // Find matches
    const matches = [];
    let pos = 0;
    while (true) {
        const found = normText.indexOf(normalizedSearch, pos);
        if (found === -1) break;
        matches.push(found);
        pos = found + normalizedSearch.length;
    }
    if (matches.length === 0) return;

    // Process matches from last to first
    for (let mi = matches.length - 1; mi >= 0; mi--) {
        const startNorm = matches[mi];
        const endNorm = startNorm + normalizedSearch.length - 1;
        const startMap = normMap[startNorm];
        const endMap = normMap[endNorm];

        const startNodeIdx = startMap.nodeIndex;
        const startOffset = startMap.charIndex;
        const endNodeIdx = endMap.nodeIndex;
        const endOffset = endMap.charIndex + 1;

        // Build matched text across nodes
        let matchText = '';
        for (let ni = startNodeIdx; ni <= endNodeIdx; ni++) {
            const nodeVal = nodes[ni].nodeValue;
            const from = (ni === startNodeIdx) ? startOffset : 0;
            const to = (ni === endNodeIdx) ? endOffset : nodeVal.length;
            matchText += nodeVal.slice(from, to);
        }

        const parent = nodes[startNodeIdx].parentNode;

        if (startNodeIdx === endNodeIdx) {
            const node = nodes[startNodeIdx];
            const before = node.nodeValue.slice(0, startOffset);
            const after = node.nodeValue.slice(endOffset);
            const beforeNode = document.createTextNode(before);
            const span = document.createElement('span');
            span.className = 'highlight';
            span.textContent = matchText;
            const afterNode = document.createTextNode(after);
            parent.insertBefore(beforeNode, node);
            parent.insertBefore(span, node);
            parent.insertBefore(afterNode, node);
            parent.removeChild(node);
            nodes[startNodeIdx] = afterNode;
        } else {
            const firstNode = nodes[startNodeIdx];
            const lastNode = nodes[endNodeIdx];
            const before = firstNode.nodeValue.slice(0, startOffset);
            const after = lastNode.nodeValue.slice(endOffset);
            const beforeNode = document.createTextNode(before);
            const span = document.createElement('span');
            span.className = 'highlight';
            span.textContent = matchText;
            const afterNode = document.createTextNode(after);
            parent.insertBefore(beforeNode, firstNode);
            parent.insertBefore(span, firstNode);
            parent.insertBefore(afterNode, firstNode);
            for (let ri = startNodeIdx; ri <= endNodeIdx; ri++) {
                const nodeToRemove = nodes[ri];
                if (nodeToRemove.parentNode) nodeToRemove.parentNode.removeChild(nodeToRemove);
            }
            nodes[startNodeIdx] = afterNode;
        }

        // Mark matched normalized chars so they won't be re-matched
        for (let i = startNorm; i <= endNorm; i++) normChars[i] = ' ';
    }
}

function removeHighlights() {
    const selectors = ['.postTitle', '.postText'];
    selectors.forEach(sel => {
        const elems = document.querySelectorAll(sel);
        elems.forEach(elem => {
            const highlights = elem.querySelectorAll('span.highlight');
            highlights.forEach(span => {
                const textNode = document.createTextNode(span.textContent);
                span.parentNode.replaceChild(textNode, span);
            });
        });
    });
}

function highlightKeywords(searchValue) {
    if (!showKeywords) return;

    let value = searchValue;
    if (typeof value === 'undefined' || value === null) {
        if (typeof $ !== 'undefined' && $('#searchKeys').length > 0)
            value = $('#searchKeys').val();
        else if (typeof $ !== 'undefined' && $('#searchToken').length > 0)
            value = $('#searchToken').val();
        else
            value = '';
    }

    removeHighlights();
    if (!value) return;

    const keywords = value.split(/\s+/).map(k => k.trim()).filter(k => k.length >= minKeywordLenth);
    if (keywords.length === 0) return;

    Array.from(document.getElementsByClassName('postTitle')).forEach(title => {
        keywords.forEach(k => highlight(k, title));
    });
    Array.from(document.getElementsByClassName('postText')).forEach(text => {
        keywords.forEach(k => highlight(k, text));
    });
}

window.highlightKeywords = highlightKeywords;
window.removeHighlights = removeHighlights;
