import { parseBlock } from '../../../src/utils/vue';
import {expect} from 'chai';

describe('utils', () => {
    it('parseBlock', () => {
        const code = `
<template>
    <div>
        <template></template>
        <script></script>
    </div>
</template>

<script>
console.log('test');
</script>
`;
        const result = parseBlock(code);
        expect(result).to.be.an('array');
        expect(result.length).to.equal(2);
        expect(result[0].type).to.equal('template');
        expect(result[0].content).to.equal(`
    <div>
        <template></template>
        <script></script>
    </div>
`);
        expect(result[1].type).to.equal('script');
        expect(result[1].content).to.equal(`
console.log('test');
`);
    });
});