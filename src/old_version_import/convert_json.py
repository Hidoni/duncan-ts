import json

def update_questions_file(path):
    with open(path) as questions_file:
        questions = json.load(questions_file)
    questions['channel'] = str(questions['channel'])
    with open(path, 'w') as questions_file:
        json.dump(questions, questions_file)

def main():
    update_questions_file('../../questions.json')

if __name__ == '__main__':
    main()