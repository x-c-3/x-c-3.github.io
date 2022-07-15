---
layout: post
title:  "STEP - Conditional Probability"
author: "me"
date:   2022-07-13 19:00:00 +0000
categories: maths step probability
description: "chance time"
---

Just learnt some fancy new MathJax magicks.

---  

# STEP I

## 2005, Question 12

### Part (i)

> The probability that a hobbit smokes a pipe is $$0.7$$ and the probability that a hobbit wears a hat is $$0.4$$. The probability that a hobbit smokes a pipe but does not wear a hat is $$p$$. Determine the range of values of $$p$$ consistent with this information.

Let $$P$$ be the event that a hobbit smokes a pipe and $$H$$ be the event that a hobbit wears a hat.

We can subdivide the hobbits smoking pipes into two groups: those that are wearing hats, and those that are not. We know that the probability of a hobbit smoking a pipe but not wearing a hat is $$p$$, so the probability of a hobbit smoking a pipe and wearing a hat must be the remainder of the group of hobbits smoking pipes. Below:

$$
\displaylines{
P(P \cap H) = P(P) - P(P \cap \neg H)\\
= 0.7 - p
}
$$

It follows that $$P(\neg P \cap H) = P(H) - P(P \cap H) = p - 0.3$$, and $$P(\neg P \cap \neg H)$$ is just one minus the sum of everything else.

It may be helpful to draw a Venn Diagram to represent this information:

![](/assets/images/maths/step/conditional_probability/venn.png)

Probabilities must be positive, which means that these inequalities must hold:

$$
\displaylines{
p \geq 0\\
p \leq 0.7\\
p \geq 0.3\\
p \leq 0.6\\
}
$$

Taking the strictest bounds gives $$0.3 \leq p \leq 0.6$$.

### Part (ii)

> The probability that a wizard wears a hat is $$0.7$$; the probability that a wizard wears a cloak is $$0.8$$; and the probability that a wizard wears a ring is $$0.4$$. The probability that a wizard does not wear a hat, does not wear a cloak and does not wear a ring is $$0.05$$. The probability that a wizard wears a hat, a cloak and also a ring is $$0.1$$. Determine the probability that a wizard wears exactly two of a hat, a cloak, and a ring.

Let $$H$$ be the event that a wizard wears a hat, $$C$$ be the event that a wizard wears a cloak, and $$R$$ be the event that a wizard wears a ring (which should be really unlikely. I am not too sure why any wizard would wear a ring, if not for Saruman, but then he would have to be skewing the statistics significantly to account for the other wizards' lack of ringliness? :( ).

I will skip chasing probabilities around the Venn diagram.

![](/assets/images/maths/step/conditional_probability/venn2.png)

We are looking for when the wizard wears exactly two of a hat, a cloak, and a ring, which are the areas where only two circles on the Venn diagram intersect each other, and not the third, and hence we are looking for the value of $$x + y + z$$.

One way in which we can do this is to look for another representation for the sum of these overlaps that uses different pieces of information. In particular, we know that $$x + y + z$$ is equal to one minus the sum of everything else. (This is analogous to comparing positive and negative space.)

$$
\displaylines{
x + y + z = 1 - ((0.6 - x - y) + (0.3 - y - z) + (0.7 - x - z) + (0.1) + (0.05))\\
= 1 - (1.75 - 2x - 2y - 2z)\\
= 2x + 2y + 2z - 0.75\\
\therefore x + y + z = 0.75
}
$$

> The probability that a wizard wears a hat but not a ring, **given** that he wears a cloak, is $$q$$. Determine the range of values of $$q$$ consistent with this information.

We are **given** that the wizard wears a cloak, so we restrict our sample space to the C circle on our Venn diagram. If they wear a hat but not a ring, they lie in area with probability $$x$$ on the diagram. The probability of landing in this region from within C will hence be $$q = \frac{x}{0.8} = \frac{5x}{4}$$.

We can alter our Venn diagram using $$x + y + z = 0.75$$:

![](/assets/images/maths/step/conditional_probability/venn3.png)

We know that probabilities must be positive, so it follows that:

$$
\displaylines{
x \geq 0.45\\
y \geq 0.05\\
z \geq 0.15\\
\therefore y + z \geq 0.2
}
$$

Using the substitution $$x + y + z = 0.75$$ again:

$$
\displaylines{
x = 0.75 - (y + z)\\
\implies x \leq 0.55\\
\therefore 0.45 \leq x \leq 0.55
}
$$

Using $$q = \frac{5x}{4}$$, we get the range $$\frac{9}{16} \leq q \leq \frac{11}{16}$$.

Note that substituting $$x + y + z = 0.75$$ is unnecessary as we substitute it back almost immediately after. It is a step simply to help observe a pattern, and the same logic is applicable on the original Venn diagram with a longer reasoning.

# STEP II

## 2012, Question 12

> A modern villa has complicated lighting controls. In order for the light in the swimming pool to be on, a particular switch in the hallway must be on and a particular switch in the kitchen must be on. There are four identical switches in the hallway and four identical switches in the kitchen. Guests cannot tell whether the switches are on or off, or what they control.
>
> Each Monday morning a guest arrives, and the switches in the hallway are either all on or all off. The probability that they are all on is $$p$$ and the probability that they are all off is $$1 - p$$. The switches in the kitchen are each on or off, independently, with probability $$\frac{1}{2}$$.

### Part (i)

> On the first Monday, a guest presses one switch in the hallway at random and one switch in the kitchen at random. Find the probability that the swimming pool light is on at the end of this process.

The light will be on iff the important switch in the hallway is on and the important switch in the kitchen is on. Consider only these important switches. If I refer to "the switch", I refer to one of these switches.

$$
\displaylines{
P(\text{hallway on after}) = P(\text{hallway off first} \cap \text{hallway switched}) \cup P(\text{hallway on first} \cap \text{hallway not switched})\\
= (1 - p) \times \frac{1}{4} + p \times \frac{3}{4}\\
= \frac{1+2p}{4}
}
$$

We can add here as the events are mutually exclusive. Similarly:

$$
\displaylines{
P(\text{kitchen on after}) = P(\text{kitchen off first} \cap \text{kitchen switched}) \cup P(\text{kitchen on first} \cap \text{kitchen not switched})\\
= \frac{1}{2} \times \frac{1}{4} + \frac{1}{2} \times \frac{3}{4}\\
= \frac{1}{2}
}
$$

The kitchen switch being on is independent to the hallway switch being on, so we can multiply probabilities here:

$$
\displaylines{
P(\text{light on}) = P(\text{hallway on after} \cap \text{kitchen on after})\\
= \frac{1+2p}{4} \times \frac{1}{2}\\
= \frac{1+2p}{8}
}
$$

> Show that the probability that the guest has pressed the swimming pool light switch in the hallway, given that the light is on at the end of the process, is $$\frac{1-p}{1+2p}$$.

$$
\displaylines{
P(A|B) = \frac{P(A \cap B)}{P(B)}\\
\therefore P(\text{hallway switched} | \text{light on}) = \frac{P(\text{hallway switched} \cap \text{light on})}{\text{light on}}\\
= \frac{\frac{1}{4} \times (1-p) \times P(\text{kitchen on after})}{\frac{1+2p}{8}}\\
= \frac{\frac{1}{4} \times (1-p) \times \frac{1}{2}}{\frac{1+2p}{8}}\\
= \frac{\frac{1-p}{8}}{\frac{1+2p}{8}}\\
= \frac{1-p}{1+2p}
}
$$

### Part (ii)

> On each of seven Mondays, guests go through the above process independently of each other, and each time the swimming pool light is found to be on at the end of the process. Given that the most likely number of days on which the swimming pool light switch in the hallway was pressed is 3, show that $$\frac{1}{4} \lt p \lt \frac{5}{14}$$.

We know that:

$$
P(\text{hallway switched} | \text{light on}) = \frac{1-p}{1+2p}
$$

from part (i). Define $$X$$ as the event that a guest switches the switch in the hallway, then $$X \sim B(7, \frac{1-p}{1+2p})$$. Using our knowledge of the binomial distribution curve, we know that there is only one peak (unimodal); therefore, if we consider when $$P(X=3)$$ is greater than both of its neighbouring values, then we are looking at when the most likely number of days on which the hallway switch was pressed is 3, as is asked.

$$
\displaylines{
P(X=2) = {7 \choose 2}(\frac{1-p}{1+2p})^2(1-\frac{1-p}{1+2p})^5\\
P(X=3) = {7 \choose 3}(\frac{1-p}{1+2p})^3(1-\frac{1-p}{1+2p})^4\\
P(X=4) = {7 \choose 4}(\frac{1-p}{1+2p})^4(1-\frac{1-p}{1+2p})^3
}
$$

Simplifying $$1-\frac{1-p}{1+2p}$$:

$$
\displaylines{
P(X=2) = {7 \choose 2}(\frac{1-p}{1+2p})^2(\frac{3p}{1+2p})^5\\
P(X=3) = {7 \choose 3}(\frac{1-p}{1+2p})^3(\frac{3p}{1+2p})^4\\
P(X=4) = {7 \choose 4}(\frac{1-p}{1+2p})^4(\frac{3p}{1+2p})^3
}
$$

We are going to be comparing these probabilities, so there is no need to do any expansion for now.

$$
\displaylines{
P(X=3) \gt P(X=4)\\
{7 \choose 3}(\frac{1-p}{1+2p})^3(\frac{3p}{1+2p})^4 \gt {7 \choose 4}(\frac{1-p}{1+2p})^4(\frac{3p}{1+2p})^3\\
{7 \choose 3}(1-p)^3(3p)^4 \gt {7 \choose 4}(1-p)^4(3p)^3
}
$$

We know $${}_n \mathrm{C}_r = {}_n \mathrm{C}_{n-r}$$, so we can cancel:

$$
\displaylines{
(1-p)^3(3p)^4 \gt (1-p)^4(3p)^3\\
3p \gt 1-p\\
p \gt \frac{1}{4}
}
$$

We are able to cancel on the second step as we assume $$p \neq 1$$ and $$p \neq 0$$. If $$p = 1$$, then the probability of the hallway switch being switched is 0 i.e the hallway switch is never switched, so this is impossible. Likewise, if $$p = 0$$, the probability of the hallway switch being switched is 1 i.e the hallway switch is always switched, so this is also impossible.

$$
\displaylines{
P(X=3) \gt P(X=2)\\
{7 \choose 3}(\frac{1-p}{1+2p})^3(\frac{3p}{1+2p})^4 \gt {7 \choose 2}(\frac{1-p}{1+2p})^2(\frac{3p}{1+2p})^5\\
{7 \choose 3}(1-p)^3(3p)^4 \gt {7 \choose 2}(1-p)^2(3p)^5\\
35(1-p)^3(3p)^4 \gt 21(1-p)^2(3p)^5\\
5(1-p) \gt 3(3p)\\
5 - 5p \gt 9p\\
5 \gt 14p\\
\frac{5}{14} \gt p\\
\therefore \frac{1}{4} \lt p \lt \frac{5}{14}
}
$$