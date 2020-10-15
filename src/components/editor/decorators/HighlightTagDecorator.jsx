import React, {useState, useEffect, useMemo} from 'react';

const HighlightTagDecorator = ({children, childDecorator={}}) => {
  // CHILD DECORATOR
  let {currentIndex, getNextComponentIndex, getComponentForIndex, getComponentProps} = childDecorator;
  const [componentIndex, setComponentIndex] = useState(-1);

  console.log('HIGHLIGHT TAG DECORATOR rendered')

  useEffect(() => {
    if (getNextComponentIndex) {
      const newComponentIndex = getNextComponentIndex(currentIndex);
      setComponentIndex(newComponentIndex);
    }
  }, [getNextComponentIndex, currentIndex]);

  const Component = useMemo(() => 
    componentIndex !== -1 ?
      getComponentForIndex(componentIndex) :
      null
  ,[componentIndex, getComponentForIndex]);

	return <span style={{ fontWeight: 'bold' }}>
    {Component ? 
      <Component {...getComponentProps(componentIndex)}
        childDecorator={{
          currentIndex: componentIndex,
          getNextComponentIndex,
          getComponentForIndex,
          getComponentProps
        }}
      /> : 
        children
      }
    </span>;
};

export { HighlightTagDecorator };
