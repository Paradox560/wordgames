import re

def filter_words(file_path):
    with open(file_path, 'r') as file:
        words = file.readlines()
    
    filtered_words = [word.strip() for word in words if len(word.strip()) >= 3 and word.strip().isalpha()]
    
    with open(file_path, 'w') as file:
        for word in filtered_words:
            file.write(word + '\n')


def filter_wordle_words(file_path):
    # Write a function that keeps only the first 5 letters of each line in the file
    with open(file_path, 'r') as file:
        words = file.readlines()

    filtered_words = [word.strip()[:5] for word in words]

    with open(file_path, 'w') as file:
        for word in filtered_words:
            file.write(word + '\n')


def unused_words(solution_set_file_path, used_words_file_path):
    # Write a function that returns the words that are in the solution set but not in the used words file
    with open(solution_set_file_path, 'r') as file:
        solution_set = set(file.readlines())

    with open(used_words_file_path, 'r') as file:
        used_words = set(file.readlines())

    unused_words = solution_set - used_words
    return unused_words


# Example usage
print(unused_words('/Users/pranavpalle/Desktop/wordhunt/src/dictionaries/solution_list.txt', '/Users/pranavpalle/Desktop/wordhunt/src/dictionaries/wordle_used.txt'))
