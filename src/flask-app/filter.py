import re

def filter_words(file_path):
    with open(file_path, 'r') as file:
        words = file.readlines()
    
    filtered_words = [word.strip() for word in words if len(word.strip()) >= 3 and word.strip().isalpha()]
    
    with open(file_path, 'w') as file:
        for word in filtered_words:
            file.write(word + '\n')

# Example usage
filter_words('/Users/pranavpalle/Desktop/wordhunt/src/dictionaries/large.txt')
