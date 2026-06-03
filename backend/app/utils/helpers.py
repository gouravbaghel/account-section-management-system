"""
Helper utilities for formatting, receipt number generation, etc.
"""
from num2words import num2words


def amount_to_words(amount: float) -> str:
    """Convert a numeric amount to words in Indian currency format."""
    if amount < 0:
        return "Negative " + amount_to_words(abs(amount))
    if amount == 0:
        return "Zero Rupees Only"

    rupees = int(amount)
    paise = round((amount - rupees) * 100)

    result = ""
    if rupees > 0:
        words = num2words(rupees, lang="en_IN")
        result = words.replace(",", "").title() + " Rupees"

    if paise > 0:
        paise_words = num2words(paise, lang="en_IN")
        paise_words = paise_words.replace(",", "").title()
        if result:
            result += " and " + paise_words + " Paise"
        else:
            result = paise_words + " Paise"

    result += " Only"
    return result


def generate_receipt_number(prefix: str, last_number: int) -> str:
    """
    Generate a receipt number like NIT-2025-00001.
    last_number is the last used sequential number.
    """
    from datetime import datetime
    year = datetime.now().year
    next_number = last_number + 1
    return f"{prefix}-{year}-{next_number:05d}"


def format_currency(amount: float) -> str:
    """Format amount as Indian currency string (e.g. ₹1,23,456.00)."""
    if amount < 0:
        return "-" + format_currency(abs(amount))

    rupees = int(amount)
    paise = round((amount - rupees) * 100)

    # Indian number formatting
    s = str(rupees)
    if len(s) > 3:
        last_three = s[-3:]
        remaining = s[:-3]
        # Group remaining digits in pairs from right
        groups = []
        while remaining:
            groups.append(remaining[-2:])
            remaining = remaining[:-2]
        groups.reverse()
        formatted = ",".join(groups) + "," + last_three
    else:
        formatted = s

    return f"₹{formatted}.{paise:02d}"
