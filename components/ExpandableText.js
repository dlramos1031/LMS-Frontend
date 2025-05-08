import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ExpandableText = ({ text, style, numberOfLines = 3, seeMoreStyle, seeLessStyle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTextLong, setIsTextLong] = useState(false);

  const onTextLayout = useCallback(
    (e) => {
      // Check if the text has more lines than the numberOfLines prop
      setIsTextLong(e.nativeEvent.lines.length > numberOfLines);
    },
    [numberOfLines]
  );

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!text) {
    return null;
  }

  return (
    <View>
      <Text
        style={style}
        numberOfLines={isExpanded ? undefined : numberOfLines}
        onTextLayout={onTextLayout} // Only set onTextLayout once to determine if text is long
      >
        {text}
      </Text>
      {isTextLong && (
        <TouchableOpacity onPress={toggleExpand}>
          <Text style={[styles.toggleText, isExpanded ? seeLessStyle : seeMoreStyle]}>
            {isExpanded ? 'See less' : 'See more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toggleText: {
    color: '#3b82f6', // Default toggle text color (blue)
    fontWeight: '600',
    marginTop: 5,
  },
});

export default ExpandableText;