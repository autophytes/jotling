import React from 'react';
import TemplatesSVG from '../../../assets/svg/TemplatesSVG';

const WikiTemplates = () => {
	return (
		<button className='file-nav document' onClick={() => console.log('clicked')}>
			<div className='svg-wrapper'>
				<TemplatesSVG />
			</div>
			<span>Templates</span>
		</button>
	);
};

export default WikiTemplates;
