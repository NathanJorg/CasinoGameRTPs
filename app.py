from flask import Flask, render_template, abort

app = Flask(__name__)

main_games = [
    {'name': 'Blackjack', 'file_path': 'blackjack.html'},
    {'name': 'Blackjack Challenge', 'file_path': 'blackjack_challenge.html'},
    {'name': 'Baccarat', 'file_path': 'baccarat.html'},
    {'name': 'Carribean Stud Poker', 'file_path': 'caribbean_stud.html'},
    {'name': 'Electronic Sic-Bo', 'file_path': 'electronic_sic-bo.html'},
    {'name': 'Mississippi Stud Poker', 'file_path': 'mississippi_stud.html'},
    {'name': 'Roulette', 'file_path': 'roulette.html'},
    {'name': 'Sic-Bo', 'file_path': 'sic-bo.html'},
    {'name': 'Soft 17 Blackjack', 'file_path': 'soft_17_blackjack.html'},
    {'name': 'Spanish Blackjack', 'file_path': 'spanish_blackjack.html'},
    {'name': 'Texas Hold\'em Bonus Poker', 'file_path': 'texas_holdem_bonus.html'},
    {'name': 'Three Card Poker', 'file_path': 'three_card_poker.html'},
    {'name': 'Ultimate Texas Hold\'em', 'file_path': 'ultimate_texas_holdem.html'},
    {'name': 'Wheel of Fortune', 'file_path': 'wheel_of_fortune.html'},
    {'name': 'Craps', 'file_path': 'craps.html'},
    {'name': 'Lucky Draw Baccarat', 'file_path': 'lucky_draw_baccarat.html'}
]

side_bets = [
    {'name': 'Perfect Pairs', 'file_path': 'sb_perfect_pairs.html', 'games': ['baccarat', 'blackjack', 'blackjack_challenge', 'soft_17_blackjack']},
    {'name': 'Dragon Bonus', 'file_path': 'sb_dragon_bonus.html', 'games': ['baccarat']},
    {'name': 'Tiger Baccarat', 'file_path': 'sb_tiger_baccarat.html', 'games': ['baccarat']},
    {'name': 'Perfect Pairs - Spanish', 'file_path': 'sb_perfect_pairs_spanish.html', 'games': ['spanish_blackjack']},
    {'name': 'Lucky Lucky', 'file_path': 'sb_lucky_lucky.html', 'games': ['blackjack', 'blackjack_challenge', 'soft_17_blackjack']},
    {'name': 'Table Jackpot System', 'file_path': 'sb_table_jackpot.html', 'games': ['mississippi_stud', 'caribbean_stud', 'texas_holdem_bonus','ultimate_texas_holdem','three_card_poker']}
]

@app.route('/')
def index():
    return render_template('index.html', main_games=main_games, side_bets=side_bets)

@app.route('/game/<game_name>')
def game_page(game_name):
    game_file = next((game['file_path'] for game in main_games if game['file_path'].replace('.html', '') == game_name), None)
    relevant_side_bets = [bet for bet in side_bets if game_name in bet['games']]
    
    if game_file:
        return render_template(f'main_games/{game_file}', side_bets=relevant_side_bets)
    else:
        abort(404)  

@app.route('/side_bets/<side_bet_name>')
def side_bet_page(side_bet_name):
    side_bet_file = next((side_bet['file_path'] for side_bet in side_bets if side_bet['file_path'].replace('.html', '') == side_bet_name), None)
    if side_bet_file:
        return render_template(f'side_bets/{side_bet_file}')
    else:
        abort(404)  

if __name__ == '__main__':
    app.run(debug=True)
