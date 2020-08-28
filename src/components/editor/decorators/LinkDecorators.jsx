import React, { useContext, useState, useEffect } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

// PROPS INCLUDE
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

const LinkSourceDecorator = (props) => {
	// CONTEXT
	const { linkStructure } = useContext(LeftNavContext);
	const [entityKey] = useState(props.entityKey);
	const [contentState] = useState(props.contentState);
	const [blockKey] = useState(props.blockKey);
	const [start] = useState(props.start);
	const [linkId, setLinkId] = useState(null);

	useEffect(() => {
		setLinkId(getLinkId(entityKey, contentState, blockKey, start));
	}, [entityKey, contentState, blockKey, start]);

	console.log('linkStructure: ', linkStructure);

	return <span style={{ textDecoration: 'underline' }}>{props.children}</span>;
};

const LinkDestDecorator = (props) => {
	return <span style={{ textDecoration: 'underline' }}>{props.children}</span>;
};

const getLinkId = (entityKey, contentState, blockKey, start) => {
	if (entityKey) {
		return contentState.getEntity(entityKey).data.linkId;
	}

	const block = contentState.getBlockForKey(blockKey);
	const retrievedEntityKey = block.getEntityAt(start);
	return contentState.getEntity(retrievedEntityKey).data.linkId;
};

export { LinkSourceDecorator, LinkDestDecorator };
