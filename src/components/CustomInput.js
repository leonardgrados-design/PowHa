import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export default function CustomInput({ icon: Icon, ...props }) {
  return (
    <View style={styles.container}>
      {Icon && <Icon size={20} color="#9CA3AF" style={styles.icon} />}
      <TextInput 
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        {...props} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 60,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  icon: { marginRight: 12 },
  input: {
    flex: 1,
    height: '100%',
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
  },
});