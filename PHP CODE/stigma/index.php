<?php
	session_start();
	$lang_available = array("fr", "ru", "en", "de");
	$lang = 'en';
	$projVersion = '0.6.3';
	
	if (isset($_GET["lang"]) && in_array($_GET["lang"], $lang_available)) {
		$lang = $_GET["lang"];
		$_SESSION['lang'] = $_GET["lang"];
	} else if (isset($_SESSION['lang'])) {
		$lang = $_SESSION['lang'];
	}
?>
<!DOCTYPE html>
<html lang="<?= $lang; ?>">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=9" />
		<meta name="viewport" content="width=800, initial-scale=1">
		<?php 
			if($lang == "fr")
			{
				echo '<meta name="description" content="Calculateur de stigma pour Aion classic. Différentes versions disponibles.">';  
			}
			else
			{
				echo '<meta name="description" content="Stigma calculator for Aion classic. 2.0 EU and 2.7 NA, with new Revenant/Executor class and new stigmas, now available. Different versions available for your stigma builds.">';  
			}
		?>
		<link rel="shortcut icon" href="favicon.ico">
		<title>Aion Classic Stigma Calculator</title>
		<link rel="stylesheet" href="style.css?v=<?= $projVersion; ?>" />
		<script src="../jquery.js"></script>
		<script src="../ui.js?v=<?= $projVersion; ?>"></script>
		<script src="../aion.js?v=<?= $projVersion; ?>"></script>
		<script src="script.js?v=<?= $projVersion; ?>"></script>
		<script src="../lang_<?= $lang; ?>.js?v=<?= $projVersion; ?>"></script>
		<script src="lang_<?= $lang; ?>.js?v=<?= $projVersion; ?>"></script>
	</head>
	
	<!-- Google tag (gtag.js) -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-EKJ3YY5RTL"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());

		gtag('config', 'G-EKJ3YY5RTL');
	</script>

	<body>
		<div class="top_link">
			<a href="https://gitlab.com/Dardok/aion-stigma-calculator" target="_blank">
				<div id="git-icon" class="icon_wrapper"></div>
				<span>GitLab</span>
			</a>
		</div>

		<div id="title">
			<h1>Aion Classic Stigma Calculator</h1>
		</div>
		
		<div id="page">	
			<div id="wrapper">
				<div class="bookmark-border" id="border_top_left"></div>
				<div class="bookmark-border" id="border_top_right"></div>
				<div class="bookmark-border" id="border_bottom_left"></div>
				<div class="bookmark-border" id="border_bottom_right"></div>
				<div class="bookmark-border-hor" id="border_top"></div>
				<div class="bookmark-border-hor" id="border_bottom"></div>
				<div class="bookmark-border-vert" id="border_left"></div>
				<div class="bookmark-border-vert" id="border_right"></div>
				<div id="version_layer"></div>
				<div id="stigma_wrapper">
					<div class="stigma-slots">
						<div class="stigma-slot" id="stigma_nor_1"></div>
						<div class="stigma-slot" id="stigma_nor_2"></div>
						<div class="stigma-slot" id="stigma_nor_3"></div>
						<div class="stigma-slot" id="stigma_nor_4"></div>
						<div class="stigma-slot" id="stigma_nor_5"></div>
						<div class="stigma-slot" id="stigma_nor_6"></div>
					</div>
					<div class="stigma-slots">
						<div class="stigma-slot stigma-slot-advance" id="stigma_adv_1"></div>
						<div class="stigma-slot stigma-slot-advance" id="stigma_adv_2"></div>
						<div class="stigma-slot stigma-slot-advance" id="stigma_adv_3"></div>
						<div class="stigma-slot stigma-slot-advance" id="stigma_adv_4"></div>
						<div class="stigma-slot stigma-slot-advance" id="stigma_adv_5"></div>
						<div class="stigma-slot stigma-slot-advance" id="stigma_adv_6"></div>
					</div>
				</div>
				<div id="stigma_free_wrapper"></div>
				<div id="stigma_tree_wrapper"></div>
				<div id="race_wrapper"></div>
				<div id="cost_wrapper"><table>
					<tr><td><div class="cost-shard"></div></td><td id="cost_shard">0</td></tr>
					<tr><td><div class="cost-abyss"></div></td><td id="cost_abyss">0</td></tr>
				</table></div>
				<div id="class_wrapper">
					<input id="class-level" name="char_level" size="2" />
					<div id="class-picker" inputname="selected_class" class="class-select"></div>
				</div>
				<div id="version_wrapper">
					<div id="select-version">Version</div>
					<div id="version-picker" inputname="selected_version" class="class-select"></div>
				</div>
				<div id="lang_buttons">
					<table class="main-button"><tr><td class="lang-icon" id="lang_en"></td></tr></table>
					<table class="main-button"><tr><td class="lang-icon" id="lang_ru"></td></tr></table>
					<table class="main-button"><tr><td class="lang-icon" id="lang_fr"></td></tr></table>
					<table class="main-button"><tr><td class="lang-icon" id="lang_de"></td></tr></table>
				</div>
				<div id="share_link"><input type="text" id="stigma_link" /></div>
			</div>
			<div id="copyright">
				<span class="iface-string" id="string_copyright"></span>
			</div>	
			
			<div id="calclink" class="bottom_link">
				<div id="stigmalink_wrap"><a href="https://aion.aspirine.su/" target="_blank" class="iface-string" id="string_equipcalc"></a></div>
			</div>
		</div>
			
		<div id="stigma_tooltip"></div>
	</body>
</html>