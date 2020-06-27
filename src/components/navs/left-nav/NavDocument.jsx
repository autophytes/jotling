import React, { useCallback } from 'react';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

const NavDocument = ({
	path,
	child,
	currentDoc,
	setCurrentDoc,
	lastClicked,
	setLastClicked,
}) => {
	const handleClick = useCallback(() => {
		currentDoc !== child.fileName && setCurrentDoc(child.fileName);
		setLastClicked({ type: 'doc', id: child.id });
	}, [setCurrentDoc, child]);

	return (
		<button
			className={'file-nav document' + (currentDoc === child.fileName ? ' active' : '')}
			// key={'doc-' + child.id}
			onClick={handleClick}>
			<div className='svg-wrapper'>
				<DocumentSingleSVG />
			</div>
			{child.name}
		</button>
	);
};

export default NavDocument;
