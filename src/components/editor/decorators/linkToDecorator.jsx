import React from 'react';

const LinkToDecorator = (props) => {
	return <span style={{ textDecoration: 'underline' }}>{props.children}</span>;
};

export default LinkToDecorator;
