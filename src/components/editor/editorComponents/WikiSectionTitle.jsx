import React, { useEffect, useState, useContext } from 'react';
import { EditorBlock } from 'draft-js';

import { LeftNavContext } from '../../../contexts/leftNavContext';
// PROPS
// block: ContentBlock {_map: Map, __ownerID: undefined}
// blockProps: undefined
// blockStyleFn: block => {…}
// contentState: ContentState {_map: Map, __ownerID: undefined}
// customStyleFn: undefined
// customStyleMap: {BOLD: {…}, CODE: {…}, ITALIC: {…}, STRIKETHROUGH: {…}, UNDERLINE: {…}, …}
// decorator: CompositeDraftDecorator {_decorators: Array(2)}
// direction: "LTR"
// forceSelection: true
// offsetKey: "ah7m4-0-0"
// preventScroll: undefined
// selection: SelectionState {_map: Map, __ownerID: undefined}
// tree: List

// TO-DO
// Potentially convert to render like the LinkDestBlock
//  - Though maybe not. Only real benefit is quick access to block, right? We can monitor
//    the children for changes in the block, update accordingly.
// Should this be a title that you have to "edit" with an input-like form? Or just text?
// On load, ensure the title is in sync with the "sections" in the docStructure
// Ensure section titles are unique per document somehow

export const WikiSectionTitle = (props) => {
	// const [blockKey, setBlockKey] = useState(block.getKey());
	const { contentState, block } = props;

	const [isEditable, setIsEditable] = useState(false);
	const [title, setTitle] = useState('New Section');

	console.log('MyCustomBlock hath rendered.');
	// console.log(props);

	const { docStructureRef, setDocStructure } = useContext(LeftNavContext);

	// If this title was just added, prompt for the name
	useEffect(() => {
		const blockData = block.getData().get('wikiSection', {});
		console.log('blockData:', blockData);
		if (blockData.isNew) {
			setIsEditable(true);
		}

		console.log('props.children changed!');
	}, []);

	useEffect(() => {
		console.log('block text: ', block.getText());
	}, [block]);

	// // Load the blockKey
	// useEffect(() => {
	// 	console.log('dataOffsetKey changed');

	// 	setBlockKey((prev) => {
	// 		if (prev !== dataOffsetKey.slice(0, 5)) {
	// 			return dataOffsetKey.slice(0, 5);
	// 		} else {
	// 			return prev;
	// 		}
	// 	});
	// }, [dataOffsetKey]);

	return (
		<div className='wiki-section-title'>
			<EditorBlock {...props} />
		</div>
	);
};

// DECORATOR PROPS INCLUDE
// blockKey: BlockNodeKey,
// children?: Array<React.Node>,
// contentState: ContentState,
// decoratedText: string,
// dir: ?HTMLDir,
// end: number,
// // Many folks mistakenly assume that there will always be an 'entityKey'
// // passed to a DecoratorComponent.
// // To find the `entityKey`, Draft calls
// // `contentBlock.getEntityKeyAt(leafNode)` and in many cases the leafNode does
// // not have an entityKey. In those cases the entityKey will be null or
// // undefined. That's why `getEntityKeyAt()` is typed to return `?string`.
// // See https://github.com/facebook/draft-js/blob/2da3dcb1c4c106d1b2a0f07b3d0275b8d724e777/src/model/immutable/BlockNode.js#L51
// entityKey: ?string,
// offsetKey: string,
// start: number,

export const WikiSectionDecorator = ({ children, decoratedText }) => {
	useEffect(() => {
		console.log('decoratedText: ', decoratedText);
	}, [decoratedText]);

	return children;
};
