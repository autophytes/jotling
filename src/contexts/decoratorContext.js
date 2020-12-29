import React, { createContext, useState } from 'react';

export const DecoratorContext = createContext();

// CONSTANTS

const DecoratorContextProvider = (props) => {
	// STATE
	const [hoverSourceLinkId, setHoverSourceLinkId] = useState(null);
	const [hoverDestLinkId, setHoverDestLinkId] = useState(null);

	return (
		<DecoratorContext.Provider
			value={{
				hoverSourceLinkId,
				setHoverSourceLinkId,
				hoverDestLinkId,
				setHoverDestLinkId,
			}}>
			{props.children}
		</DecoratorContext.Provider>
	);
};

export default DecoratorContextProvider;
