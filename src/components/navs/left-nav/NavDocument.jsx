import React, { useCallback } from 'react';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

const NavDocument = ({ path, child, currentDoc, setCurrentDoc }) => {
	const handleClick = useCallback(() => {
		currentDoc !== child.fileName && setCurrentDoc(child.fileName);
	}, [setCurrentDoc, child]);

	return (
		<p
			className={'file-nav document' + (currentDoc === child.fileName ? ' active' : '')}
			key={'doc-' + child.id}
			onMouseDown={handleClick}>
			<DocumentSingleSVG />
			{child.name}
		</p>
	);
};

export default NavDocument;
