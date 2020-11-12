import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { usePopper } from 'react-popper';

const PopperVerticalContainer = ({
	referenceElement,
	closeFn,
	children,
	leftOffset = 50,
	rightOffset = 50,
	isContentRendered = true,
}) => {
	// REFS
	const popperElement = useRef(null);
	const arrowElement = useRef(null);

	// STATE
	const [minWidth, setMinWidth] = useState(0);

	// POPPER
	const { styles, attributes } = usePopper(referenceElement, popperElement.current, {
		placement: 'right',
		modifiers: [
			// { name: 'arrow', options: { element: arrowElement.current } },
			{
				name: 'offset',
				options: {
					offset: [0, 10],
				},
			},
			{ name: 'flip', options: { rootBoundary: 'viewport', fallbackPlacements: ['right'] } },
			{
				name: 'preventOverflow',
				options: {
					enabled: true,
					altAxis: true,
					padding: { left: leftOffset, right: rightOffset, top: 100, bottom: 20 }, // TOP OFFSET needs to be the top nav and editor nav
				},
			},
		],
	});

	// NEED TO UPDATE - close function
	// Closes the popper if clicking outside the popper or hitting escape
	useEffect(() => {
		const handleEscapePopper = (e) => {
			if (e.keyCode === 27) {
				e.stopPropagation();
				closeFn();
			}
		};

		const handleExternalClickPopper = (e) => {
			if (!popperElement.current.contains(e.target)) {
				e.stopPropagation();
				closeFn();
			}
		};

		document.addEventListener('click', handleExternalClickPopper);
		document.addEventListener('keyup', handleEscapePopper);

		return () => {
			document.removeEventListener('click', handleExternalClickPopper);
			document.removeEventListener('keyup', handleEscapePopper);
		};
	}, []);

	return (
		<div
			ref={popperElement}
			style={styles.popper}
			{...attributes.popper}
			id='link-popper-element'>
			<div className='link-popper add-to-wiki'>
				{/* PASS THROUGH CHILDREN */}
				{children}
			</div>
		</div>
	);
};

export default PopperVerticalContainer;
