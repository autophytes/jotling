import React from 'react';

const HighlightTagDecorator = (props) => {
	return <span style={{ fontWeight: 'bold' }}>{props.children}</span>;
};

export { HighlightTagDecorator };
