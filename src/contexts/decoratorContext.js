import React, { createContext, useState } from 'react';

export const DecoratorContext = createContext();

// CONSTANTS

const DecoratorContextProvider = (props) => {
	// STATE
	const [hoverSourceLinkId, setHoverSourceLinkId] = useState(null);
	const [hoverDestLinkId, setHoverDestLinkId] = useState(null);
	const [hoverCommentId, setHoverCommentId] = useState(null);

	return (
		<DecoratorContext.Provider
			value={{
				hoverSourceLinkId,
				setHoverSourceLinkId,
				hoverDestLinkId,
				setHoverDestLinkId,
				hoverCommentId,
				setHoverCommentId,
			}}>
			{props.children}
		</DecoratorContext.Provider>
	);
};

export default DecoratorContextProvider;
